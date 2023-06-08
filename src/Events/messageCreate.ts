import { EventHandler, IGuildConfig } from "../..";
import STRINGS from "../../../strings";
import { HOOK_CODES } from "../constants";
import * as utils from "../Utils";

// should guildConfig be in a bread only hook?

export default new EventHandler("messageCreate", (bot) => async (msg): Promise<void> => {
    let hookReturn: HOOK_CODES;
    for (const hook of bot.hooks?.messageCreate?.immediately || []) switch (hookReturn = await hook(bot, msg)) {
        case HOOK_CODES.OK:
        case HOOK_CODES.CONTINUE:
            break;
        case HOOK_CODES.STOP:
            return;
        default:
            bot.logger.debug(`unknown hook return "${hookReturn}" for messageCreate.immediately hook ${hook.name || "with unknown name"}`);
    }
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

    for (const hook of bot.hooks?.messageCreate?.beforeCommand || []) switch (hookReturn = await hook(bot, msg, cmd, args, prefix)) {
        case HOOK_CODES.OK:
        case HOOK_CODES.CONTINUE:
            break;
        case HOOK_CODES.STOP:
            return;
        default:
            bot.logger.debug(`unknown hook return "${hookReturn}" for messageCreate.beforeCommand hook ${hook.name || "with unknown name"}`);
    }

    if (!cmd.startsWith(prefix)) return;

    let command;
    cmd = cmd.slice(prefix.length);

    if (bot.commands.get(cmd)) command = bot.commands.get(cmd);
    else if (bot.commands.get(<string>bot.aliases.get(cmd))) command = bot.commands.get(<string>bot.aliases.get(cmd));

    if (command) utils.discord.runCommand(bot, msg, args, command);
});
