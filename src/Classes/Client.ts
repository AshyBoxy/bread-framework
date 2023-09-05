// import { Snowflake } from "discord-api-types/v10";
import { Client, ClientEvents, Collection } from "discord.js";
import { readdirSync } from "fs";
import * as path from "path";
import IConfig from "../Interfaces/Config";
// import IGuildConfig from "../Interfaces/GuildConfig";
import ILogger from "../Interfaces/Logger";
import IModule from "../Interfaces/Module";
// import IUserData from "../Interfaces/UserData";
import STRINGS from "../strings";
import { logger } from "../Utils";
import Command from "./Command";
import EventHandler from "./EventHandler";
import BreadMessage from "../Interfaces/Message";
import { HOOK_CODES } from "../constants";
import IGuildConfig from "../Interfaces/GuildConfig";
import IDatabase from "../Interfaces/Database";

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

    // guildConfigs: BreadDB<IGuildConfig>;
    // userData: BreadDB<IUserData>;
    dbs: DBRecord<Databases & RequiredDBs>;

    logger: ILogger;

    constructor(
        config: IConfig, modules: IModule[], /*guildConfigs: BreadDB<IGuildConfig>, userData: BreadDB<IUserData>,*/
        dbs: DBRecord<Databases>, public hooks?: HooksType<Databases>
    ) {
        super(config);
        this.config = config;
        this.modules = modules;
        // this.guildConfigs = guildConfigs;
        // this.userData = userData;
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
            ...readdirSync(this.config.eventsPath).map((x) => ({ path: x, dir: this.config.eventsPath })),
            ...readdirSync(BreadClient.BuiltInEventPath).map((x) => ({ path: x, dir: BreadClient.BuiltInEventPath }))
        ].filter((x: eventFile) => x.path.endsWith(".js"));
        this.logger.debug(eventFiles.map((x) => x.path));

        for (let i = 0; i < eventFiles.length; i++) {
            const event: EventHandler<keyof ClientEvents> = (await import(path.join(eventFiles[i].dir, eventFiles[i].path))).default;
            this.on(event.name, event.execute(<BreadClient>this));
            events.push(event.name);
        }
        infos.push(STRINGS.CLASSES.CLIENT.LOADED.EVENTS(events));


        const modulesLog: string[] = [];

        const moduleFiles = [
            ...(<(path: string, opts: object) => string[]>readdirSync)(this.config.commandsPath, { recursive: true }).filter((x) => /module\.jso?n?$/.test(x)).map((x) => path.join(this.config.commandsPath, x)),
            ...(<(path: string, opts: object) => string[]>readdirSync)(BreadClient.BuiltInCommandsPath, { recursive: true }).filter((x) => /module\.jso?n?$/.test(x)).map((x) => path.join(BreadClient.BuiltInCommandsPath, x))
        ];
        for (const file of moduleFiles) this.modules.push({
            path: path.dirname(file),
            ...(await import(file, file.endsWith(".json") ? { assert: { type: "json" } } : undefined)).default
        });

        for (let i = 0; i < this.modules.length; i++) {
            const cmdFiles = readdirSync(path.join(this.modules[i].path.startsWith("/") ? "" : this.config.commandsPath, this.modules[i].path)).filter((x: string) => x.endsWith(".js"));

            const commands: string[] = [];
            for (let x = 0; x < cmdFiles.length; x++) {
                const cmd: Command = (await import(path.join(this.modules[i].path.startsWith("/") ? "" : this.config.commandsPath, this.modules[i].path, cmdFiles[x]))).default;
                if (!cmd?.run || !cmd?.name) {
                    warnings.push(STRINGS.CLASSES.CLIENT.WARNINGS.COMMAND(cmdFiles[x].split(".js")[0], this.modules[i].name));
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
        infos.push(STRINGS.CLASSES.CLIENT.LOADED.MODULES(modulesLog));


        if (infos.length > 0) this.logger.info(infos.join("\n"));
        if (warnings.length > 0) this.logger.warn(warnings.join("\n"));
    }

    // async getUserData(id: Snowflake): Promise<IUserData> {
    //     let userData = await this.userData.get(id);
    //     const dataCopy: IUserData = JSON.parse(JSON.stringify(userData || {}));
    //     userData = defaultData();
    //     Object.assign(userData, dataCopy);

    //     return userData;
    // }

    // async setUserData(id: Snowflake, data: IUserData): Promise<void> {
    //     await this.userData.set(id, data);
    //     return;
    // }



    async shutdown(reason: string): Promise<void> {
        this.logger.info(STRINGS.MAIN.SHUTTING_DOWN(reason));
        await Promise.all([
            // this.guildConfigs.db.close(), this.userData.db.close()
            ...Object.values(this.dbs).map((db: IDatabase<unknown>) => db.close()),
            this.logger.flush?.()
        ]);
        this.destroy();
        process.exit();
    }
}

export default BreadClient;

// function defaultData(): IUserData {
//     return {
//         test: "default",
//         breadCollection: {
//             nonShiny: 0,
//             shiny: 0,
//             squareShiny: 0,
//             golden: 0
//         }
//     };
// }
