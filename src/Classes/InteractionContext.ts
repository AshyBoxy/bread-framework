/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ChannelType, InteractionCallbackResponse, MessageCreateOptions, MessagePayload, MessageReplyOptions, RepliableInteraction } from "discord.js";
import { ChatInteractionBasedContext, ComponentInteractionBasedContext, Context, GuildContext, InteractionBasedContext, MessageBasedContext } from "../Interfaces/Context";
import BreadMessage from "../Interfaces/Message";
import BreadClient from "./Client";

export default class InteractionContext implements Context, GuildContext, InteractionBasedContext {
    constructor(public int: RepliableInteraction) { }

    #deferred: Promise<unknown> | null = null;

    send(options: string | MessagePayload | MessageCreateOptions) {
        return this.reply(options);
    };
    async reply(options: string | MessagePayload | MessageReplyOptions) {
        if (!this.int.isRepliable()) throw new Error("Tried to reply to unrepliable interaction");
        await this.ensureDeferredFinished();
        const reply = await (this.int.deferred ? this.int.editReply(<never>options) : this.int.reply(<never>options));
        try {
            return <never>(await this.int.channel?.messages.fetch((<InteractionCallbackResponse>reply).interaction?.responseMessageId || (<BreadMessage>reply).id || ""));
        } catch (e) {
            return <never>null;
        }
    };

    defer() {
        if (!this.int.deferred && !this.#deferred)
            this.#deferred = this.int.deferReply();
    }

    async ensureDeferredFinished() {
        await this.#deferred;
    }

    get client() {
        return <BreadClient>this.int.client;
    }

    get user() {
        return this.int.user;
    }
    get channel() {
        return this.int.channel;
    }

    get interaction() {
        return this.int;
    }

    inGuild(): this is GuildContext {
        return this.int.inGuild();
    }
    get guildId() {
        return <never>this.int.guildId;
    }
    get inDm() {
        if (!this.int.channel) return <never>false;
        return <never>(this.int.channel.type === ChannelType.DM || this.int.channel.type === ChannelType.GroupDM);
    }
    get member() {
        return <never>this.int.member;
    }
    get guild() {
        return this.int.guild;
    }

    isMessageBased(): this is MessageBasedContext {
        return false;
    }
    isInteractionBased(): this is InteractionBasedContext {
        return true;
    }
    isChatInteractionBased(): this is ChatInteractionBasedContext {
        return this.int.isChatInputCommand();
    }
    isComponentInteractionBased(): this is ComponentInteractionBasedContext {
        return !this.int.isChatInputCommand();
    }
}
