import { APIUser, Client, ClientEvents, Collection, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord.js";
import { readdirSync } from "fs";
import * as path from "path";
import IConfig from "../Interfaces/Config";
import IDatabase from "../Interfaces/Database";
import IGuildConfig from "../Interfaces/GuildConfig";
import ILogger from "../Interfaces/Logger";
import BreadMessage from "../Interfaces/Message";
import IModule from "../Interfaces/Module";
import { logger } from "../Utils";
import { HOOK_CODES } from "../constants";
import Command from "./Command";
import EventHandler from "./EventHandler";
import { strings } from "..";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HooksType<Databases extends Record<string, IDatabase<any>>> = {
    messageCreate?: {
        immediately?: ((bot: BreadClient<Databases>, msg: BreadMessage) => Promise<HOOK_CODES> | HOOK_CODES)[];
        beforeCommand?: ((bot: BreadClient<Databases>, msg: BreadMessage, cmd: string, args: string[], prefix: string) => Promise<HOOK_CODES> | HOOK_CODES)[];
    };
};

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

    dbs: DBRecord<Databases & RequiredDBs>;

    logger: ILogger;

    constructor(
        config: IConfig, dbs: DBRecord<Databases>, modules: IModule[] = [], public hooks?: HooksType<Databases>
    ) {
        super(config);
        this.config = config;
        this.modules = modules;
        this.dbs = {
            ...dbs,
            guildConfigs: dbs.guildConfigs || new MapDB()
        };

        this.logger = new logger(<BreadClient>this);
    }

    async setup(): Promise<void> {
        const warnings: string[] = [];
        const infos: string[] = [];


        const events: string[] = [];
        type eventFile = { path: string, dir: string; };
        const eventFiles: eventFile[] = [
            ...this.config.eventsPath ? readdirSync(this.config.eventsPath).map((x) => ({ path: x, dir: <string>this.config.eventsPath })) : [],
            ...readdirSync(BreadClient.BuiltInEventPath).map((x) => ({ path: x, dir: BreadClient.BuiltInEventPath }))
        ].filter((x: eventFile) => x.path.endsWith(".js"));

        for (let i = 0; i < eventFiles.length; i++) {
            const event: EventHandler<keyof ClientEvents> = (await import(path.join(eventFiles[i].dir, eventFiles[i].path))).default;
            this.on(event.name, event.execute(<BreadClient>this));
            events.push(event.name);
        }
        infos.push(strings.get("bread_framework.classes.breadclient.events", events.join(", ")));


        const modulesLog: string[] = [];

        const moduleFiles = [
            ...this.config.commandsPath ? (<(path: string, opts: object) => string[]>readdirSync)(this.config.commandsPath, { recursive: true }).filter((x) => /module\.jso?n?$/.test(x)).map((x) => path.join(<string>this.config.commandsPath, x)) : [],
            ...(<(path: string, opts: object) => string[]>readdirSync)(BreadClient.BuiltInCommandsPath, { recursive: true }).filter((x) => /module\.jso?n?$/.test(x)).map((x) => path.join(BreadClient.BuiltInCommandsPath, x))
        ];
        for (const file of moduleFiles) this.modules.push({
            path: path.dirname(file),
            ...(await import(file, file.endsWith(".json") ? { assert: { type: "json" } } : undefined)).default
        });

        for (let i = 0; i < this.modules.length; i++) {
            const cmdFiles = readdirSync(path.join(this.modules[i].path.startsWith("/") ? "" : this.config.commandsPath || "", this.modules[i].path)).filter((x: string) => x.endsWith(".js"));

            const commands: string[] = [];
            for (let x = 0; x < cmdFiles.length; x++) {
                const cmd: Command = (await import(path.join(this.modules[i].path.startsWith("/") ? "" : this.config.commandsPath || "", this.modules[i].path, cmdFiles[x]))).default;
                if (!cmd?.run || !cmd?.name) {
                    warnings.push(strings.get("bread_framework.classes.breadclient.commandwarning", cmdFiles[x].split(".js")[0], this.modules[i].name));
                    continue;
                }
                cmd.module = this.modules[i];
                this.commands.set(cmd.name.toLowerCase(), cmd);
                if (cmd.aliases) for (let y = 0; y < cmd.aliases.length; y++)
                    this.aliases.set(cmd.aliases[y], cmd.name.toLowerCase());
                commands.push(cmd.name);
            }
            modulesLog.push(`${this.modules[i].name} (${commands.join(", ")})`);
        }
        infos.push(strings.get("bread_framework.classes.breadclient.modules", modulesLog.join("; ")));


        if (infos.length > 0) this.logger.info(infos.join("\n"));
        if (warnings.length > 0) this.logger.warn(warnings.join("\n"));
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
