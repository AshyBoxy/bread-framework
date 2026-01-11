import { APIApplicationCommand, APIUser, Client, ClientEvents, Collection, RESTGetAPIApplicationCommandsResult, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord.js";
import { readdirSync, readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { HOOK_CODES, strings } from "..";
import IConfig from "../Interfaces/Config";
import IDatabase from "../Interfaces/Database";
import IGuildConfig from "../Interfaces/GuildConfig";
import ILogger from "../Interfaces/Logger";
import IModule from "../Interfaces/Module";
import { logger } from "../Utils";
import { HookFn, HookPhases, HookPhasesFor, Hooks, HooksType, setHookLogger } from "../Utils/hooks";
import Command from "./Command";
import EventHandler from "./EventHandler";
import MapDB from "./MapDB";

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
export interface BreadUserDBs extends Record<string, IDatabase<any>> { }

type DBRecord<K extends object> = {
    [P in keyof K]: K[P]
};
interface RequiredDBs {
    guildConfigs: IDatabase<IGuildConfig>;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnknownDBs = Record<string, IDatabase<any>>;

type Databases = DBRecord<UnknownDBs & BreadUserDBs & RequiredDBs>;

interface StoredCommand {
    id: string;
    /**
     * argument name to argument id
     */
    args: Record<string, string>;
    // technically we only need to store the discord id
    raw: APIApplicationCommand;
}

type RawCommandTypes = APIApplicationCommand | RESTPostAPIChatInputApplicationCommandsJSONBody;

const validFileRegex = /\.[tj]s$/;
const fileSplitRegex = /\.[tj]s/;

// using true here basically makes typescript assume the bot is ready
// meaning it won't enforce type checking
// this probably shouldn't be left like this(?)
class BreadClient extends Client<true> {
    static BuiltInEventPath = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "Events");
    static BuiltInCommandsPath = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "Commands");

    config: IConfig;
    modules: IModule[];
    commands: Collection<string, Command> = new Collection();
    aliases: Collection<string, string> = new Collection();

    dbs: Databases;

    logger: ILogger;

    moduleSearchPaths: string[] = [];
    hooks: HooksType = {};

    #setupDone = false;
    get setupDone(): boolean {
        return this.#setupDone;
    }

    constructor(
        config: IConfig, dbs: DBRecord<UnknownDBs & Partial<BreadUserDBs>>, modules: IModule[] = [], hooks: HooksType = {}
    ) {
        super(config);
        this.config = config;
        this.modules = modules;
        this.dbs = {
            ...dbs,
            guildConfigs: dbs.guildConfigs || new MapDB()
        };

        this.logger = new logger(this.config.logging || {});

        this.addModuleSearchPath(BreadClient.BuiltInCommandsPath);
        if (this.config.commandsPath) this.addModuleSearchPath(this.config.commandsPath);

        for (const hookName of <Hooks[]>Object.keys(hooks)) {
            this.hooks[hookName] = {};
            const thisPhaseMap = <Record<string, never[]>>this.hooks[hookName];
            const thatPhaseMap = <Record<string, never[]>>hooks[hookName];
            for (const phase of <HookPhases[]>Object.keys(thatPhaseMap || {}))
                thisPhaseMap[phase] = <never[]>[...thatPhaseMap[phase] || []];
        }
        setHookLogger(this.logger);

        if (config.token) this.rest.setToken(config.token);
    }

    addModuleSearchPath(p: string): void {
        if (this.setupDone) throw new Error("Cannot add module search paths after setup");
        this.moduleSearchPaths.unshift(p);
    }

    addHooks<H extends Hooks, P extends HookPhasesFor<H>>(hookName: H, phase: P, ...hooks: ((...args: Parameters<HookFn<H, P>>) => Promise<HOOK_CODES> | HOOK_CODES)[]): void {
        if (this.setupDone) throw new Error("Cannot add hooks after setup");

        if (!this.hooks[hookName]) this.hooks[hookName] = {};
        const phaseMap = <Record<string, never[]>>this.hooks[hookName];
        if (!phaseMap[<string>phase]) phaseMap[<string>phase] = [];
        phaseMap[<string>phase].push(...<never[]>hooks);
    }

    async setup(): Promise<void> {
        if (this.setupDone) throw new Error("Client is already set up");
        this.#setupDone = true;

        const warnings: string[] = [];
        const infos: string[] = [];

        const stats: Stats = {
            events: 0,
            modules: 0,
            commands: 0,
            manualNameCommands: 0,
            messageOnlyCommands: 0,
            interactionOnlyCommands: 0,
            componentCommands: 0
        };


        const events: string[] = [];
        type eventFile = { path: string, dir: string; };
        const eventFiles: eventFile[] = [
            ...this.config.eventsPath ? readdirSync(this.config.eventsPath).map((x) => ({ path: x, dir: <string>this.config.eventsPath })) : [],
            ...readdirSync(BreadClient.BuiltInEventPath).map((x) => ({ path: x, dir: BreadClient.BuiltInEventPath }))
        ].filter((x: eventFile) => validFileRegex.test(x.path));

        for (const eventFile of eventFiles) {
            const event: EventHandler<keyof ClientEvents> = (await import(path.join(eventFile.dir, eventFile.path))).default;
            this.on(event.name, event.execute(<BreadClient>this));
            events.push(event.name);
            stats.events++;
        }
        infos.push(strings.get("bread_framework.classes.breadclient.events", events.join(", ")));


        const modulesLog: string[] = [];

        const moduleFiles: string[] = [];
        for (const searchPath of this.moduleSearchPaths) {
            const files = readdirSync(searchPath, { recursive: true, encoding: "utf8" });
            const mFiles = files.filter((x) => /module\.jso?n?$/.test(x)).map((x) => path.join(searchPath, x));
            moduleFiles.push(...mFiles);
        }
        for (const file of moduleFiles) {
            const module = {
                path: path.dirname(file),
                ...(await import(file, file.endsWith(".json") ? { with: { type: "json" } } : undefined)).default
            };

            if (module.development && !this.config.development) continue;

            if (module.ns) {
                const id = module.id || path.dirname(file);
                if (!module.name)
                    module.name = `${module.ns}.modules.${id}`;
                if (!module.description)
                    module.description = `${module.ns}.modules.${id}.description`;
            }

            this.modules.push(module);
            stats.modules++;
        }
        for (const module of this.modules) {
            const cmdFiles = readdirSync(path.join(module.path.startsWith("/") ? "" : this.config.commandsPath || "", module.path)).filter((x: string) => validFileRegex.test(x));

            const commands: string[] = [];
            for (const cmdFile of cmdFiles) {
                const cmd: Command = (await import(path.join(module.path.startsWith("/") ? "" : this.config.commandsPath || "", module.path, cmdFile))).default;
                cmd.module = module;

                cmd.setNs(module.ns, path.basename(cmdFile).split(".").slice(0, -1).join(".") || path.basename(cmdFile));

                if (!cmd?.run || !cmd?.name) {
                    warnings.push(strings.get("bread_framework.classes.breadclient.commandwarning", cmdFile.split(fileSplitRegex)[0], strings.get(module.name)));
                    continue;
                }

                this.commands.set(cmd.name, cmd);
                // if (cmd.aliases) for (const alias of cmd.aliases)
                //     this.aliases.set(alias, cmd.name.toLowerCase());
                commands.push(cmd.getName());
                stats.commands++;
                if (cmd.name === cmd.getName()) stats.manualNameCommands++;
                if (cmd.messageOnly) stats.messageOnlyCommands++;
                if (cmd.interactionOnly) stats.interactionOnlyCommands++;
                if (cmd.runComponent) stats.componentCommands++;

                if (cmd.tmpUnsupportedMessageArgs) warnings.push(`Command ${cmd.getFullId()} is supposed to work as a message command but has required numeric arguments`);
            }
            modulesLog.push(`${strings.get(module.name)} (${commands.join(", ")})`);
        }
        infos.push(strings.get("bread_framework.classes.breadclient.modules", modulesLog.join("; ")));


        if (infos.length > 0) this.logger.info(infos.join("\n"));
        if (warnings.length > 0) this.logger.warn(warnings.join("\n"));

        this.logger.info(`Stats: ${Object.entries(stats).map((x) => `${x[0]}: ${x[1]}`).join(", ")}`);
    }

    commandByName(name: string): Command | null {
        const n = name.toLowerCase();
        for (const cmd of this.commands.values()) {
            if (n === cmd.getName().toLowerCase()) return cmd;
            if (cmd.aliases.includes(n)) return cmd;
        }
        return this.commandById(name);
    }

    commandById(id: string): Command | null {
        const cmd = this.commands.get(id);
        if (cmd) return cmd;
        for (const c of this.commands.values()) {
            if (c.getFullId() === id) return c;
            if (`${c.ns}.${c.id}` === id) return c;
            if (c.id === id) return c;
        }
        return null;
    }

    async shutdown(reason: string): Promise<void> {
        this.logger.info(strings.get("bread_framework.classes.breadclient.shutting_down", reason));
        await Promise.all([
            // this.guildConfigs.db.close(), this.userData.db.close()
            ...Object.values(this.dbs).map((db: IDatabase<unknown>) => db.close()),
            this.logger.flush?.()
        ]);
        this.destroy();
        process.exit();
    }

    private cachedClientUser: APIUser | null = null;
    async getClientUser(cache = true): Promise<APIUser> {
        if (cache && this.cachedClientUser) return this.cachedClientUser;
        const client = (<APIUser | null>await this.rest.get(Routes.user()));
        if (!client) throw new Error("Unable to get client user");
        this.cachedClientUser = client;
        return client;
    }

    async publishCommands(guildIds: string[] = []): Promise<void> {
        void guildIds;
        this.logger.info("Publishing slash commands");
        if (!this.config.commandsSavePath) this.logger.warn("No commandsSavePath configured, slash commands will be broken");
        if (!this.config.token) throw new Error("No token provided");
        const rest = this.rest;

        const client = await this.getClientUser();

        const cmds: Command[] = this.commands.filter((x) => !x.messageOnly).map((x) => x);

        this.logger.info(`Publishing commands: ${cmds.map((x) => x.name).join(", ")}`);

        const discordKnown = <RESTGetAPIApplicationCommandsResult>await rest.get(Routes.applicationCommands(client.id));

        // TODO: guild specific commands

        this.logger.debug("Publishing commands globally");

        // need to do these one by one so we can attach our ids

        // TODO: skipping unchanged commands (done)
        // TODO: updating existing commands
        // TODO: deleting removed commands

        const res: StoredCommand[] = [];
        let intermediate: (Omit<StoredCommand, "raw"> & { raw: RESTPostAPIChatInputApplicationCommandsJSONBody; })[] = [];
        for (const cmd of cmds) {
            const slashCommand = cmd.createSlashCommand(this.logger);
            intermediate.push({
                id: cmd.getFullId(),
                args: slashCommand.args,
                raw: slashCommand.builder.toJSON()
            });
        }

        if (this.config.commandsSavePath) {
            const saved: StoredCommand[] = JSON.parse(readFileSync(this.config.commandsSavePath, { encoding: "utf8" }));
            let unchanged = 0;
            intermediate = intermediate.filter((x) => {
                const existing = saved.find((y) => y.id === x.id);
                if (!existing) return true;

                const discord = discordKnown.find((a) => a.id === existing.raw.id);
                // the command seems to have been deleted
                if (!discord) return true;

                if (this.checkRawCommandsEqual(x.raw, discord)) {
                    unchanged++;
                    res.push({
                        id: x.id,
                        args: x.args,
                        raw: discord
                    });
                    return false;
                }

                // TODO: patch in this case. this will probably result in stale commands when names are changed
                return true;
            });
            this.logger.info(`Skipping ${unchanged} unchanged commands`);
        }

        let published = 0;
        for (const cmd of intermediate) {
            const r = <APIApplicationCommand>await rest.post(Routes.applicationCommands(client.id), { body: cmd.raw });
            res.push({
                id: cmd.id,
                args: cmd.args,
                raw: r
            });
            published++;
        }
        this.logger.info(`Published ${published} new commands`);

        if (this.config.commandsSavePath) {
            this.logger.info("Saving slash commands");
            writeFileSync(this.config.commandsSavePath, JSON.stringify(res, null, 4), { encoding: "utf8" });
        }

        this.logger.info("Finished publishing slash commands");
    }

    private checkRawCommandsEqual(a: RawCommandTypes, b: RawCommandTypes): boolean {
        if (a.name !== b.name) return false;
        if (a.description !== b.description) return false;
        if ((a.options?.length ?? 0) !== (b.options?.length ?? 0)) return false;
        // TODO: be more thorough
        return true;
    }

    async clearCommands(guildIds: string[] = []): Promise<void> {
        this.logger.info("Clearing slash commands");
        // mm duplicated code
        if (!this.config.token) throw new Error("No token provided");
        const rest = this.rest;

        const client = await this.getClientUser();

        if (guildIds.length > 0) {
            let guilds: unknown[] | string = guildIds.map(async (x) => ((<Record<string, string>>(await rest.get(Routes.guild(x)))).name));
            for (let i = 0; i < guilds.length; i++) guilds[i] = await guilds[i];
            guilds = guilds.join(", ");
            this.logger.debug(`Clearing commands for guilds: ${guilds}`);

            for (const g of guildIds) await rest.put(Routes.applicationGuildCommands(client.id, g), { body: [] });
        } else {
            this.logger.debug("Clearing commands globally");
            await rest.put(Routes.applicationCommands(client.id), { body: [] });
        }
    }
}

export default BreadClient;
