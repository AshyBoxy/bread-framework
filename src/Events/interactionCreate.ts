import { Utils } from "..";
import EventHandler from "../Classes/EventHandler";

export default new EventHandler("interactionCreate", (bot) => (int): void => {
    if (int.isButton())
        int.reply("i don't know how to handle buttons");
    else if (int.isChatInputCommand()) {
        // int.reply("how do commands work");
        let command;
        const cmd = int.commandName.toLowerCase();
        if (bot.commands.get(cmd)) command = bot.commands.get(cmd);
        else if (bot.commands.get(<string>bot.aliases.get(cmd))) command = bot.commands.get(<string>bot.aliases.get(cmd));

        if (command) Utils.discord.runCommand(bot, int, [], command);
        else int.reply("unknown command error");
    }
});
