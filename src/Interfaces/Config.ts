import { ClientOptions } from "discord.js";

interface ClientConfig {
    prefix: string;
    token: string;
    logging: {
        webhook: {
            "id": string;
            "token": string;
        };
    };
    eventsPath: string;
    commandsPath: string;
    dbBasePath: string;
}
type IConfig = ClientConfig & ClientOptions;

export default IConfig;
