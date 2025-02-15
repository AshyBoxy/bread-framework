import { EventHandler, IGuildConfig, strings } from "../..";
import * as utils from "../Utils";
import { runHooks } from "../Utils/hooks";

// should guildConfig be in a bread only hook?

export default new EventHandler("messageCreate", (bot) => async (msg): Promise<void> => {
    if (await runHooks("messageCreate.immediately", bot.hooks.messageCreate?.immediately, bot, msg)) return;
    if (msg.author.bot) return;

    let guildConfig: IGuildConfig | undefined;
    if (msg.guild) {
        guildConfig = await bot.dbs.guildConfigs.get(msg.guild.id);
        if (!guildConfig) {
            guildConfig = {
                prefix: bot.config.prefix || "!",
                disabledCommands: []
            };
            bot.dbs.guildConfigs.set(msg.guild.id, guildConfig);
        }
    }

    const msgArr = msg.content.split(" ");
    let cmd = msgArr[0].toLowerCase();
    let args = msgArr.slice(1);

    let prefix = guildConfig?.prefix || bot.config.prefix || "!";

    if (!cmd) return;

    if (new RegExp(`^<@!?${bot.user?.id}>$`).test(cmd)) {
        if (!msgArr[1]) return msg.channel.send(strings.get("bread_framework.events.message.prefix", prefix)), undefined;
        cmd = msgArr[1].toLowerCase();
        args = msgArr.slice(2);
        prefix = "";
    }

    if (await runHooks("messageCreate.beforeCommand", bot.hooks.messageCreate?.beforeCommand, bot, msg, cmd, args, prefix)) return;

    if (cmd.startsWith(prefix)) {
        let command;
        cmd = cmd.slice(prefix.length);

        if (bot.commands.get(cmd)) command = bot.commands.get(cmd);
        else if (bot.commands.get(<string>bot.aliases.get(cmd))) command = bot.commands.get(<string>bot.aliases.get(cmd));

        if (command) {
            utils.discord.runCommand(bot, msg, args, command);
            return
        }
    }

    runHooks("messageCreate.notCommand", bot.hooks.messageCreate?.notCommand, bot, msg, cmd, args);
});
