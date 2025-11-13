import { Channel, ChatInputCommandInteraction, CollectedInteraction, Guild, GuildMember, InteractionReplyOptions, InteractionResponse, Message, MessageComponentInteraction, MessagePayload, MessageReplyOptions, ModalSubmitInteraction, PartialTextBasedChannelFields, RepliableInteraction, Snowflake, TextBasedChannel, User } from "discord.js";
import BreadClient from "../Classes/Client";
import BreadMessage from "./Message";

type MessageReplySignature = Message["reply"];
type InteractionReplySignature = MessageComponentInteraction["reply"];
type BaseReplySignature =
    ((options: string | MessagePayload | MessageReplyOptions) => Promise<Message | InteractionResponse>) |
    ((options: string | MessagePayload | InteractionReplyOptions) => Promise<Message | InteractionResponse>);


interface Context {
    send: PartialTextBasedChannelFields["send"];
    reply: BaseReplySignature;

    client: BreadClient;

    user: User;
    channel: Channel | null;

    inGuild(): this is GuildContext;
    get guildId(): Snowflake | null;
    inDm: boolean;
    get member(): GuildMember | null;
    get guild(): Guild | null;

    isMessageBased(): this is MessageBasedContext;
    isInteractionBased(): this is InteractionBasedContext;
    isChatInteractionBased(): this is ChatInteractionBasedContext;
    isComponentInteractionBased(): this is ComponentInteractionBasedContext;
}

interface GuildContext extends Context {
    inDm: false;
    get guildId(): Snowflake;
    get guild(): Guild | null;
}

interface MessageBasedContext extends Context {
    reply: MessageReplySignature;
    content: string;
    message: BreadMessage;
    channel: TextBasedChannel;
}

interface InteractionBasedContext extends Context {
    reply: InteractionReplySignature;
    defer: () => void;
    ensureDeferredFinished: () => Promise<void>;
    interaction: RepliableInteraction;
}

interface ChatInteractionBasedContext extends InteractionBasedContext {
    interaction: ChatInputCommandInteraction;
}

type ComponentInteraction = Exclude<CollectedInteraction, ModalSubmitInteraction>;

interface ComponentInteractionBasedContext extends InteractionBasedContext {
    interaction: ComponentInteraction;
}

export { ChatInteractionBasedContext, ComponentInteractionBasedContext, Context, GuildContext, InteractionBasedContext, MessageBasedContext, MessageReplySignature, InteractionReplySignature };
