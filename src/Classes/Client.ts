import { APIUser, Client, ClientEvents, Collection, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord.js";
import { readdirSync } from "fs";
import * as path from "path";
import IConfig from "../Interfaces/Config";
import IDatabase from "../Interfaces/Database";
import IGuildConfig from "../Interfaces/GuildConfig";
import ILogger from "../Interfaces/Logger";
import IModule from "../Interfaces/Module";
import { logger } from "../Utils";
import Command from "./Command";
import EventHandler from "./EventHandler";
import { strings } from "..";
import { HooksType, setHookLogger } from "../Utils/hooks";

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
export interface BreadUserDBs extends Record<string, IDatabase<any>> { }

type DBRecord<K extends object> = {
    [P in keyof K]: K[P]
};
type RequiredDBs = {
    guildConfigs: IDatabase<IGuildConfig>;
};

class MapDB<valueType> implements IDatabase<valueType> {
    #map = new Map<string, valueType>();
    get(key: string): valueType | undefined {
        return this.#map.get(key);
    }
    put(key: string, value: valueType): void {
        this.#map.set(key, value);
    }
    set = this.put;
    close = (): Promise<void> => new Promise((r) => r());
}

const validFileRegex = /\.[tj]s$/;
const fileSplitRegex = /\.[tj]s/;

// using true here basically makes typescript assume the bot is ready
// meaning it won't enforce type checking
// this probably shouldn't be left like this(?)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class BreadClient<Databases extends Record<string, IDatabase<any>> = Record<string, IDatabase<unknown>>> extends Client<true> {
    static BuiltInEventPath = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "Events");
    static BuiltInCommandsPath = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "Commands");

    config: IConfig;
    modules: IModule[];
    commands: Collection<string, Command> = new Collection();
    aliases: Collection<string, string> = new Collection();

    dbs: DBRecord<Databases & BreadUserDBs & RequiredDBs>;

    logger: ILogger;

    constructor(
        config: IConfig, dbs: DBRecord<Databases & BreadUserDBs>, modules: IModule[] = [], public hooks: HooksType<Databases> = {}
    ) {
        super(config);
        this.config = config;
        this.modules = modules;
        this.dbs = {
            ...dbs,
            guildConfigs: dbs.guildConfigs || new MapDB()
        };

        this.logger = new logger(this.config.logging || {});

        setHookLogger(this.logger);
    }

    async setup(): Promise<void> {
        const warnings: string[] = [];
        const infos: string[] = [];


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
        }
        infos.push(strings.get("bread_framework.classes.breadclient.events", events.join(", ")));


        const modulesLog: string[] = [];

        const moduleFiles = [
            ...this.config.commandsPath ? (<(path: string, opts: object) => string[]>readdirSync)(this.config.commandsPath, { recursive: true }).filter((x) => /module\.jso?n?$/.test(x)).map((x) => path.join(<string>this.config.commandsPath, x)) : [],
            ...(<(path: string, opts: object) => string[]>readdirSync)(BreadClient.BuiltInCommandsPath, { recursive: true }).filter((x) => /module\.jso?n?$/.test(x)).map((x) => path.join(BreadClient.BuiltInCommandsPath, x))
        ];
        for (const file of moduleFiles) {
            const module = {
                path: path.dirname(file),
                ...(await import(file, file.endsWith(".json") ? { with: { type: "json" } } : undefined)).default
            };

            if (module.ns) {
                const id = module.id || path.dirname(file);
                if (!module.name)
                    module.name = `${module.ns}.modules.${id}`;
                if (!module.description)
                    module.description = `${module.ns}.modules.${id}.description`;
            }

            this.modules.push(module);
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
            }
            modulesLog.push(`${strings.get(module.name)} (${commands.join(", ")})`);
        }
        infos.push(strings.get("bread_framework.classes.breadclient.modules", modulesLog.join("; ")));


        if (infos.length > 0) this.logger.info(infos.join("\n"));
        if (warnings.length > 0) this.logger.warn(warnings.join("\n"));
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

    // eslint-disable-next-line require-await
    async publishCommands(guildIds: string[] = []): Promise<void> {
        this.logger.info("Publishing slash commands");
        if (!this.config.token) throw new Error("No token provided");
        const rest = new REST().setToken(this.config.token);

        const clientId: string | undefined = (<APIUser | null>await rest.get(Routes.user()))?.id;
        if (!clientId) throw new Error("Unable to get clientId");
        // this.logger.info(`My client id is ${clientId}`);

        if (guildIds.length > 0) {
            let guilds: unknown[] | string = guildIds.map(async (x) => ((<Record<string, string>>(await rest.get(Routes.guild(x)))).name));
            for (let i = 0; i < guilds.length; i++) guilds[i] = await guilds[i];
            guilds = guilds.join(", ");
            this.logger.debug(`Publishing commands for guilds: ${guilds}`);

            const cmds: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
            this.commands.forEach((x) => {
                if (x.slashCommand.name === "ping")
                    cmds.push(x.slashCommand.toJSON());
            });
            this.logger.info(`Publishing commands: ${cmds.map((x) => x.name).join(", ")}`);
            for (const g of guildIds) await rest.put(Routes.applicationGuildCommands(clientId, g), { body: cmds });
        } else
            this.logger.debug("Publishing commands globally");
    }
}

export default BreadClient;
