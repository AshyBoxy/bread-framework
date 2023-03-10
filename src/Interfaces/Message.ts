import { Message, StageChannel } from "discord.js";
import CustomClient from "../Classes/Client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReplaceReturnType<T extends (...a: any) => any, TNewReturn> = (...a: Parameters<T>) => TNewReturn;

// following CustomClient's naming scheme
export default interface CustomMessage extends Message {
    client: CustomClient;
    channel: Exclude<Message["channel"], StageChannel>;
    fetch: ReplaceReturnType<(force?: boolean) => Promise<Message>, Promise<CustomMessage>>;
}
