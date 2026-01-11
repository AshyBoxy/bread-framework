import { Events } from "discord.js";
import { EventHandler, Hooks, runHooks } from "..";
import STRINGS from "../strings";

export default new EventHandler(Events.ClientReady, (bot) => async (): Promise<void> => {
    if (await runHooks(Hooks.ClientReady, bot.hooks.clientReady?.immediately, bot)) return;
    bot.logger.info(STRINGS.get("bread_framework.events.ready.online", bot.user?.tag || "unknown(?)"));
});
