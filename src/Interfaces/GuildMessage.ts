import { Guild, TextChannel, NewsChannel } from "discord.js";
import BreadMessage from "./Message";

export default interface IGuildMessage extends BreadMessage {
    guild: Guild;
    channel: TextChannel | NewsChannel;
    guildId: string;
}
