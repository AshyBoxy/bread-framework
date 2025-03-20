/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ChannelType, ChatInputCommandInteraction, MessageCreateOptions, MessagePayload, MessageReplyOptions } from "discord.js";
import { Context, GuildContext, InteractionBasedContext, MessageBasedContext } from "../Interfaces/Context";

export default class InteractionContext implements Context, GuildContext, InteractionBasedContext {
    constructor(public int: ChatInputCommandInteraction) { }

    send(options: string | MessagePayload | MessageCreateOptions) {
        return this.reply(options);
    };
    async reply(options: string | MessagePayload | MessageReplyOptions) {
        if (!this.int.isRepliable()) throw new Error("Tried to reply to unrepliable interaction");
        const reply = await this.int.reply(<never>options);
        try {
            return <never>(await this.int.channel?.messages.fetch(reply.interaction.responseMessageId || ""));
        } catch (e) {
            return <never>null;
        }
    };

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
}
