import { ChannelType, ChatInputCommandInteraction, GuildMember, PermissionResolvable } from "discord.js";
import { RETURN_CODES } from "../constants";
import { Client, Command, Message } from "../..";
import Strings from "../strings";

async function runCommand(bot: Client, msg: Message | ChatInputCommandInteraction, args: string[], command: Command): Promise<unknown> {
    if (!msg.channel) Object.defineProperty(msg, "channel", {
        value: await bot.channels.fetch(msg.channelId)
    });
    if (!msg.channel) return msg.reply("woopsie");
    if ((<ChatInputCommandInteraction>msg).isChatInputCommand?.()) msg.channel.send = (...a: unknown[]): Promise<never> => <Promise<never>>(<(...arg0: unknown[]) => Promise<never>>msg.reply)(...a);

    if (command.disabled)
        return msg.channel.send(Strings.get("bread_framework.utils.discord.disabled"));
    if (command.guildOnly && !msg.guild)
        return msg.channel.send(Strings.get("bread_framework.utils.discord.guild_only"));
    if (command.dmOnly && msg.channel.type !== ChannelType.DM)
        return msg.channel.send(Strings.get("bread_framework.utils.discord.dm_only"));
    if (command.permission && msg.channel.type !== ChannelType.DM)
        if (!checkPermission(command.permission, <GuildMember>msg.member))
            return msg.channel.send(Strings.get("bread_framework.utils.discord.bad_permissions"));
        else if (!checkPermission(command.botPermission, <GuildMember>msg.guild?.members.me))
            return msg.channel.send(Strings.get("bread_framework.utils.discord.bot_permissions"));

    const cmdRun = await (<Promise<number | void>>command.run(bot, <Message>msg, args))?.catch?.((err) => {
        bot.logger.error(Strings.get("bread_framework.utils.discord.error_log", command.name, err?.toString?.() || Strings.get("bread_framework.utils.discord.error_log.empty")));
        return RETURN_CODES.ERROR;
    });

    switch (cmdRun) {
        case RETURN_CODES.BAD_USAGE:
            return msg.channel.send(Strings.get("bread_framework.utils.discord.bad_usage", bot.config.prefix, command.usage));
        case RETURN_CODES.ERROR:
            return msg.channel.send(Strings.get("bread_framework.utils.discord.error"));
        default:
            return;
    }
}

function checkPermission(permission: PermissionResolvable, member: GuildMember): boolean {
    if (!permission || !member) return false;

    const hasPerm = member.permissions.has(permission);

    return hasPerm;
}

export { runCommand, checkPermission };
