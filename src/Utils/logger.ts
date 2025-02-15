/* eslint-disable no-console */
import { WebhookClient, WebhookClientData, WebhookClientOptions } from "discord.js";
import { LoggingConfig, WebhookUrlConfig } from "../Interfaces/Config";
import ILogger from "../Interfaces/Logger";

const webhookSettings: WebhookClientOptions = {
    allowedMentions: { parse: [] }
};

class Logger implements ILogger {
    private webhookCounter = 0;
    private webhooks: WebhookClient[] = [];
    #unlogged: Record<number, Promise<unknown>>;

    constructor(public config: LoggingConfig) {
        if (config.webhook)
            if (typeof (<WebhookUrlConfig>config.webhook).url !== "object")
                this.addWebhook(new WebhookClient(<WebhookClientData>config.webhook, webhookSettings));
            else for (const url of (<WebhookUrlConfig>config.webhook).url)
                this.addWebhook(new WebhookClient({ url }, webhookSettings));

        this.#unlogged = [];

        this.debug("hello from logger.ts");
    }

    private addWebhook(webhook: WebhookClient): void {
        this.webhooks[this.webhookCounter] = webhook;
        this.webhookCounter++;
    }

    sendWebhook(msg: string): void {
        for (const webhookId in this.webhooks) {
            // this feels like it would be buggy
            const id = Object.keys(this.#unlogged).length + 1;
            const promise = this.webhooks[webhookId].send(msg).then(() => {
                delete this.#unlogged[id];
            }).catch((err) => {
                delete this.#unlogged[id];
                delete this.webhooks[webhookId];
                this.error(err.toString ? err.toString() : err);
            });

            if (promise) this.#unlogged[id] = promise;
        }
    }

    async flush(): Promise<void> {
        await Promise.all(Object.values(this.#unlogged));
    }

    log(prefix: string, message: string | string[], extras?: Record<string, unknown>): void {
        let msg = `${new Date().toUTCString()} ${prefix}: `;
        if (typeof message === "object") msg += message.join(" ");
        else msg += message;
        if (extras && Object.keys(extras).length > 0) msg += ` (${JSON.stringify(extras)})`;
        console.log(msg);

        this.sendWebhook(`>>> ${msg}`)
    }

    error(message: string | string[], extras?: Record<string, unknown>): void {
        this.log("error", message, extras);
    }

    warn(message: string | string[], extras?: Record<string, unknown>): void {
        this.log("warn", message, extras);
    }

    info(message: string | string[], extras?: Record<string, unknown>): void {
        this.log("info", message, extras);
    }
    debug(message: string | string[], extras?: Record<string, unknown>): void {
        this.log("debug", message, extras);
    }
}

export const logger = Logger;
export default logger;
