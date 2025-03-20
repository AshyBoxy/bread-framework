import { Channel, ChatInputCommandInteraction, Guild, GuildMember, Message, PartialTextBasedChannelFields, Snowflake, TextBasedChannel, User } from "discord.js";

interface Context {
    send: PartialTextBasedChannelFields["send"];
    reply: Message["reply"];

    user: User;
    channel: Channel | null;

    inGuild(): this is GuildContext;
    get guildId(): Snowflake | null;
    inDm: boolean;
    get member(): GuildMember | null;
    get guild(): Guild | null;

    isMessageBased(): this is MessageBasedContext;
    isInteractionBased(): this is InteractionBasedContext;
}

interface GuildContext extends Context {
    inDm: false;
    get guildId(): Snowflake;
    get guild(): Guild | null;
}

interface MessageBasedContext extends Context {
    content: string;
    message: Message;
    channel: TextBasedChannel;
}

interface InteractionBasedContext extends Context {
    interaction: ChatInputCommandInteraction;
}

export { Context, GuildContext, InteractionBasedContext, MessageBasedContext };

