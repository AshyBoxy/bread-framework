import { Guild, GuildMember, User } from "discord.js";
import { Client } from "..";

async function memberFromMention(guild: Guild, arg: string): Promise<GuildMember | null> {
    const id = idFromMention(arg);
    if (!id || !guild) return null;
    const member = await guild.members.fetch(id);
    if (!member) return null;
    return member;
}

async function userFromMention(bot: Client, arg: string): Promise<User | null> {
    const id = idFromMention(arg);
    if (!id) return null;
    const user = await bot.users.fetch(id);
    if (!user) return null;
    return user;
}

function idFromMention(arg: string): string | null {
    if (!arg) return null;
    const mentions = arg.match(/^<@!?(\d+)>$/);
    if (!mentions) return null;
    const id = mentions[1];
    return id;
}

export { memberFromMention, userFromMention, idFromMention };
