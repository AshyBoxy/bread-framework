import { GuildMember, PermissionResolvable } from "discord.js";
import { Client, Command } from "../..";
import { RETURN_CODES } from "../constants";
import { Context } from "../Interfaces/Context";
import Strings from "../strings";
import { ParsedArguments } from "../Classes/Arguments";

async function runCommand(bot: Client, ctx: Context, args: ParsedArguments, command: Command): Promise<unknown> {
    if (command.disabled)
        return ctx.send(Strings.get("bread_framework.utils.discord.disabled"));
    if (command.guildOnly && !ctx.inGuild())
        return ctx.send(Strings.get("bread_framework.utils.discord.guild_only"));
    if (ctx.guildId) {
        const guildConfig = await bot.dbs.guildConfigs.get(ctx.guildId) || {};
        guildConfig.userDisabledCommands ??= {};
        const cmds = guildConfig.userDisabledCommands[ctx.user.id] || [];
        if (cmds.includes(command.getFullId()))
            return ctx.reply(Strings.get("bread_framework.utils.discord.user_disabled"));
    }
    if (command.dmOnly && !ctx.inDm)
        return ctx.send(Strings.get("bread_framework.utils.discord.dm_only"));
    if (command.permission && ctx.inGuild() && bot.guilds.cache.get(ctx.guildId))
        if (!checkPermission(command.permission, <GuildMember>ctx.member))
            return ctx.send(Strings.get("bread_framework.utils.discord.bad_permissions"));
        else if (!checkPermission(command.botPermission, <GuildMember>ctx.guild?.members.me))
            return ctx.send(Strings.get("bread_framework.utils.discord.bot_permissions"));

    const cmdRun = await (<Promise<number | void>>command.run(bot, ctx, args))?.catch?.((err) => {
        bot.logger.error(Strings.get("bread_framework.utils.discord.error_log", command.getName(), err?.toString?.() || Strings.get("bread_framework.utils.discord.error_log.empty")));
        return RETURN_CODES.ERROR;
    });

    switch (cmdRun) {
        case RETURN_CODES.BAD_USAGE:
            return ctx.send(Strings.get("bread_framework.utils.discord.bad_usage", bot.config.prefix, command.getUsage()));
        case RETURN_CODES.ERROR:
            return ctx.send(Strings.get("bread_framework.utils.discord.error"));
        default:
            return;
    }
}

function checkPermission(permission: PermissionResolvable, member: GuildMember): boolean {
    if (!permission || !member) return false;

    const hasPerm = member.permissions?.has?.(permission) ?? true; // probably running as a user app in a guild the bot isn't in

    return hasPerm;
}

export { checkPermission, runCommand };

