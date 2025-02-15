import { ClientOptions } from "discord.js";

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
}
type IConfig = ClientConfig & ClientOptions;

export default IConfig;
export { ClientConfig, LoggingConfig, WebhookIdTokenConfig, WebhookUrlConfig, WebhookConfig };
