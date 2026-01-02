import { GuildMember, InteractionResponse, PermissionResolvable } from "discord.js";
import { BreadMessage, Client, Command } from "../..";
import { ParsedArguments } from "../Classes/Arguments";
import { advancedCheck } from "../Classes/Command";
import { RETURN_CODES } from "../constants";
import { Context } from "../Interfaces/Context";
import Strings from "../strings";

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
    if (!(command.advancedPermission?.(bot, ctx) ?? true))
        return ctx.send(Strings.get("bread_framework.utils.discord.bad_permissions"));
    if (command.permission && ctx.inGuild() && bot.guilds.cache.get(ctx.guildId))
        if (!checkPermission(command.permission, <GuildMember>ctx.member))
            return ctx.send(Strings.get("bread_framework.utils.discord.bad_permissions"));
        else if (!checkPermission(command.botPermission, <GuildMember>ctx.guild?.members.me))
            return ctx.send(Strings.get("bread_framework.utils.discord.bot_permissions"));

    const cmdRun = await (<Promise<number | void>>command.run(bot, ctx, args))?.catch?.((err) => {
        bot.logger.error(Strings.get("bread_framework.utils.discord.error_log", command.getName(), err?.toString?.() || Strings.get("bread_framework.utils.discord.error_log.empty")));
        // eslint-disable-next-line no-console
        console.error(err);
        return RETURN_CODES.ERROR;
    });

    const send = (str: string): void => {
        if (ctx.isInteractionBased() && ctx.interaction.replied && !ctx.interaction.deferred)
            ctx.interaction.editReply(str);
        else
            ctx.send(str);
    };

    switch (cmdRun) {
        case RETURN_CODES.BAD_USAGE:
            return send(Strings.get("bread_framework.utils.discord.bad_usage", bot.config.prefix, command.getUsage()));
        case RETURN_CODES.ERROR:
            return send(Strings.get("bread_framework.utils.discord.error"));
        default:
            return;
    }
}

function checkPermission(permission: PermissionResolvable, member: GuildMember): boolean {
    if (!permission || !member) return false;

    const hasPerm = member.permissions?.has?.(permission) ?? true; // probably running as a user app in a guild the bot isn't in

    return hasPerm;
}

const ownerOnlyPermission: advancedCheck = (bot, ctx) => bot.config.owners?.includes(ctx.user.id) ?? false;

export { checkPermission, ownerOnlyPermission, runCommand };

export async function sendSplit(ctx: Context, content: string): Promise<BreadMessage> {
    if (ctx.isMessageBased()) {
        if (content.length > 1950) {
            const next = content.slice(1950).trim();
            const msg = ctx.send(content.slice(0, 1950));
            if (next.length < 1) return <Promise<BreadMessage>>msg;
            await msg;
            return sendSplit(ctx, next);
        }
        return <Promise<BreadMessage>>ctx.send(content);
    } else if (ctx.isInteractionBased() && ctx.interaction.deferred) {
        if (content.length <= 1950) return <Promise<BreadMessage>>ctx.interaction.editReply(content);
        let c = content.slice(1950).trim();
        let m = await ctx.interaction.editReply(content.slice(0, 1950));
        while (c.length > 0) {
            const o = c.slice(0, 1950).trim();
            c = c.slice(1950).trim();
            m = await ctx.interaction.followUp(o);
        }
        return <BreadMessage>m;
    }
    throw new Error(`Can't handle context ${ctx}`);
}
