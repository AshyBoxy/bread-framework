import { PermissionFlagsBits } from "discord.js";
import { GuildCommand, strings } from "..";
import { RETURN_CODES } from "../constants";
import { memberFromMention } from "../Utils/mentions";

export default new GuildCommand(async (bot, msg, args) => {
    // this isn't great
    const config = await bot.dbs.guildConfigs.get(msg.guildId) || {};
    config.userDisabledCommands ??= {};

    if (args.length < 2) return RETURN_CODES.BAD_USAGE;
    const member = await memberFromMention(msg.guild, args[0]) || await memberFromMention(msg.guild, args[1]);
    if (!member) return RETURN_CODES.BAD_USAGE;

    const userConfig = config.userDisabledCommands[member.id] ||= [];

    let flag = "";
    if (args[0].startsWith("-")) flag = args.shift() || "";
    let remove = false;

    if (flag === "-s") {
        if (userConfig.length < 1)
            msg.reply(strings.get("bread_framework.commands.builtin.disablecmd.show.none", member.displayName));
        else
            msg.reply(strings.get("bread_framework.commands.builtin.disablecmd.show", member.displayName, userConfig.map((x) => bot.commandByName(x)?.getName() || x).join(", ")));

        return RETURN_CODES.OK;
    } else if (flag === "-r") remove = true;

    if (args.length < 2) return RETURN_CODES.BAD_USAGE;

    const cmd = bot.commandByName(args[1]);
    if (!remove) {
        if (!cmd) return msg.reply(strings.get("bread_framework.commands.builtin.disablecmd.nonexistent_command")), RETURN_CODES.OK;
        userConfig.push(cmd.getFullId());
        msg.reply(strings.get("bread_framework.commands.builtin.disablecmd.disabled", member.displayName, cmd.getName()));
    } else {
        const i = userConfig.indexOf(cmd?.getFullId() || args[1]);
        if (i < 0)
            msg.reply(strings.get("bread_framework.commands.builtin.disablecmd.not_disabled", member.displayName, cmd?.getName() || args[1]));
        else {
            userConfig.splice(i, 1);
            msg.reply(strings.get("bread_framework.commands.builtin.disablecmd.enabled", member.displayName, cmd?.getName() || args[1]));
        }
    }

    bot.dbs.guildConfigs.put(msg.guildId, config);
    return RETURN_CODES.OK;
}, {
    aliases: ["dcmd"],
    permission: PermissionFlagsBits.Administrator
});
