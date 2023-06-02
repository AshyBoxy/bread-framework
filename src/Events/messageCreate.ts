import { EventHandler, IGuildConfig } from "../..";
import STRINGS from "../../../strings";
import * as utils from "../../../Utils";

// react, guildConfig(?), and $hi should be in a bread only hook
// discord utils need to be moved into framework

export default new EventHandler("messageCreate", (bot) => async (msg): Promise<void> => {
    for (const hook of bot.hooks?.messageCreate?.immediately || []) hook(bot, msg);
    if (msg.author.bot) return;

    let guildConfig: IGuildConfig | undefined;
    if (msg.guild) {
        guildConfig = await bot.guildConfigs.get(msg.guild.id);
        if (!guildConfig) {
            guildConfig = {
                prefix: bot.config.prefix,
                disabledCommands: [],
                reactionRoles: []
            };
            bot.guildConfigs.set(msg.guild.id, guildConfig);
        }
    }

    const msgArr = msg.content.split(" ");
    let cmd = msgArr[0].toLowerCase();
    let args = msgArr.slice(1);

    let prefix = guildConfig?.prefix || bot.config.prefix;

    if (!cmd) return;

    if (new RegExp(`^<@!?${bot.user?.id}>$`).test(cmd)) {
        if (!msgArr[1]) return msg.channel.send(STRINGS.EVENTS.MESSAGE.PREFIX(prefix)), undefined;
        cmd = msgArr[1].toLowerCase();
        args = msgArr.slice(2);
        prefix = "";
    }

    for (const hook of bot.hooks?.messageCreate?.beforeCommand || []) switch (await hook(bot, msg, cmd, args, prefix)) {
        case 0:
            break;
        case 1:
            return;
        default:
            bot.logger.debug(`unknown hook return for hook ${hook.name || "with unknown name"}`);
    }

    if (!cmd.startsWith(prefix)) return;

    let command;
    cmd = cmd.slice(prefix.length);

    if (bot.commands.get(cmd)) command = bot.commands.get(cmd);
    else if (bot.commands.get(<string>bot.aliases.get(cmd))) command = bot.commands.get(<string>bot.aliases.get(cmd));

    if (command) utils.discord.runCommand(bot, msg, args, command);
});
