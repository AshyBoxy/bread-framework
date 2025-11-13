/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ChannelType, MessageCreateOptions, MessagePayload, MessageReplyOptions } from "discord.js";
import { ChatInteractionBasedContext, ComponentInteractionBasedContext, Context, GuildContext, InteractionBasedContext, MessageBasedContext } from "../Interfaces/Context";
import BreadMessage from "../Interfaces/Message";
import BreadClient from "./Client";

export default class MessageContext implements Context, GuildContext, MessageBasedContext {
    constructor(public msg: BreadMessage) { }

    send(options: string | MessagePayload | MessageCreateOptions): Promise<BreadMessage> {
        if (!this.msg.channel.isSendable()) throw new Error(`Tried to send in unsendable channel ${this.msg.channel.name} (${this.msg.channel.type})`);
        return <never>this.msg.channel.send(options);
    };

    reply(options: string | MessagePayload | MessageReplyOptions) {
        return this.msg.reply(options);
    }

    get client() {
        return <BreadClient>this.msg.client;
    }

    get user() {
        return this.msg.author;
    }
    get content() {
        return this.msg.content;
    }
    get message() {
        return this.msg;
    }
    get channel() {
        return this.msg.channel;
    }

    inGuild(): this is GuildContext {
        return this.msg.inGuild();
    }
    get guildId() {
        return <never>this.msg.guildId;
    }
    get inDm() {
        return <never>(this.msg.channel.type === ChannelType.DM || this.msg.channel.type === ChannelType.GroupDM);
    }
    get member() {
        return this.msg.member;
    }
    get guild() {
        return this.msg.guild;
    }

    isMessageBased(): this is MessageBasedContext {
        return true;
    }
    isInteractionBased(): this is InteractionBasedContext {
        return false;
    }
    isChatInteractionBased(): this is ChatInteractionBasedContext {
        return false;
    }
    isComponentInteractionBased(): this is ComponentInteractionBasedContext {
        return false;
    }
}
