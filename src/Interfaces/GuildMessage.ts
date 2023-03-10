import { Message, Guild, TextChannel, NewsChannel } from "discord.js";

export default interface IGuildMessage extends Message<true> {
    guild: Guild;
    channel: TextChannel | NewsChannel;
}
