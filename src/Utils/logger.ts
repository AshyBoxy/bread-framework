/* eslint-disable no-console */
import { WebhookClient } from "discord.js";
import BreadClient from "../Classes/Client";
import ILogger from "../Interfaces/Logger";

class Logger implements ILogger {
    private webhook?: WebhookClient;
    #unlogged: Record<number, Promise<unknown>>;

    constructor(bot?: BreadClient) {
        if (bot?.config.logging?.webhook) this.webhook = new WebhookClient(
            { id: bot.config.logging.webhook.id, token: bot.config.logging.webhook.token },
            { allowedMentions: { parse: [] } });

        this.#unlogged = [];

        this.debug("hello from logger.ts");
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

        // this feels like it would be buggy
        const id = Object.keys(this.#unlogged).length + 1;
        const promise = this.webhook?.send(`>>> ${msg}`).then(() => {
            delete this.#unlogged[id];
        }).catch((err) => {
            delete this.webhook;
            this.error(err.toString ? err.toString() : err);
        });

        if (promise) this.#unlogged[id] = promise;
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
