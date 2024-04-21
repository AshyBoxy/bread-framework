import { Guild, TextChannel, NewsChannel } from "discord.js";
import BreadMessage from "../Interfaces/Message";

export default interface IGuildMessage extends BreadMessage {
    guild: Guild;
    channel: TextChannel | NewsChannel;
}
