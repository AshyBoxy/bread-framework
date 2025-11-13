import { Events } from "discord.js";
import { EventHandler } from "..";
import STRINGS from "../strings";

export default new EventHandler(Events.ClientReady, (bot) => (): void => {
    bot.logger.info(STRINGS.get("bread_framework.events.ready.online", bot.user?.tag || "unknown(?)"));
});
