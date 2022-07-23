import { EventHandler } from "..";
import STRINGS from "../strings";

export default new EventHandler("ready", (bot) => (): void => {
    bot.logger.info(STRINGS.EVENTS.READY.ONLINE(bot.user?.tag || ""));
});
