import { ClientOptions, Snowflake } from "discord.js";

interface WebhookIdTokenConfig {
    id: string;
    token: string;
}

interface WebhookUrlConfig {
    url: string | string[];
}

type WebhookConfig = WebhookIdTokenConfig | WebhookUrlConfig;

interface LoggingConfig {
    webhook?: WebhookConfig;
}

interface ClientConfig {
    prefix?: string;
    token?: string;
    logging?: LoggingConfig;
    eventsPath?: string;
    commandsPath?: string;
    development?: boolean;
    owners?: Snowflake[];
}

// eslint-disable-next-line
interface UserConfig {}

type IConfig = ClientConfig & ClientOptions & UserConfig;

export default IConfig;
export { ClientConfig, LoggingConfig, WebhookIdTokenConfig, WebhookUrlConfig, WebhookConfig, UserConfig };
