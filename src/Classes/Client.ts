import { Client, ClientEvents, Collection } from "discord.js";
import { readdirSync } from "fs";
import * as path from "path";
import IUserData from "../Interfaces/UserData";
import IConfig from "../Interfaces/Config";
import IGuildConfig from "../Interfaces/GuildConfig";
import IModule from "../Interfaces/Module";
import STRINGS from "../strings";
import { logger } from "../Utils";
import Command from "./Command";
import EventHandler from "./EventHandler";
import LevelDB from "./LevelDB";
import { Snowflake } from "discord-api-types/v10";

// what is going on with the discord.js typings
class CustomClient extends Client<true> {
    static BuiltInEventPath = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "Events");

    config: IConfig;
    modules: IModule[];
    commands: Collection<string, Command> = new Collection();
    aliases: Collection<string, string> = new Collection();

    guildConfigs: LevelDB<IGuildConfig>;
    userData: LevelDB<IUserData>;

    logger = logger;

    constructor(
        config: IConfig, modules: IModule[], guildConfigs: LevelDB<IGuildConfig>, userData: LevelDB<IUserData>
    ) {
        super(config);
        this.config = config;
        this.modules = modules;
        this.guildConfigs = guildConfigs;
        this.userData = userData;
    }

    async setup(): Promise<void> {
        const warnings: string[] = [];
        const infos: string[] = [];


        const events: string[] = [];
        type eventFile = { path: string, dir: string; };
        const eventFiles: eventFile[] = [
            ...readdirSync(this.config.eventsPath).map((x) => ({ path: x, dir: this.config.eventsPath })),
            ...readdirSync(CustomClient.BuiltInEventPath).map((x) => ({ path: x, dir: CustomClient.BuiltInEventPath }))
        ].filter((x: eventFile) => x.path.endsWith(".js"));
        this.logger.debug(eventFiles.map((x) => x.path));

        for (let i = 0; i < eventFiles.length; i++) {
            const event: EventHandler<keyof ClientEvents> = (await import(path.join(eventFiles[i].dir, eventFiles[i].path))).default;
            this.on(event.name, event.execute(this));
            events.push(event.name);
        }
        infos.push(STRINGS.CLASSES.CLIENT.LOADED.EVENTS(events));


        const modulesLog: string[] = [];
        for (let i = 0; i < this.modules.length; i++) {
            const cmdFiles = readdirSync(path.join(this.config.commandsPath, this.modules[i].path)).filter((x: string) => x.endsWith(".js"));

            const commands: string[] = [];
            for (let x = 0; x < cmdFiles.length; x++) {
                const cmd: Command = (await import(path.join(this.config.commandsPath, this.modules[i].path, cmdFiles[x]))).default;
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

    async getUserData(id: Snowflake): Promise<IUserData> {
        let userData = await this.userData.get(id);
        const dataCopy: IUserData = JSON.parse(JSON.stringify(userData || {}));
        userData = defaultData();
        Object.assign(userData, dataCopy);

        return userData;
    }

    async setUserData(id: Snowflake, data: IUserData): Promise<void> {
        await this.userData.set(id, data);
        return;
    }



    async shutdown(reason: string): Promise<void> {
        this.logger.info(STRINGS.MAIN.SHUTTING_DOWN(reason));
        await Promise.all([
            this.guildConfigs.db.close(), this.userData.db.close()
        ]);
        this.destroy();
        process.exit();
    }
}

export default CustomClient;

function defaultData(): IUserData {
    return {
        test: "default",
        breadCollection: {
            nonShiny: 0,
            shiny: 0,
            squareShiny: 0,
            golden: 0
        }
    };
}
