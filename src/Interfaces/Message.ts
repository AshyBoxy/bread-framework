import { Message, PartialGroupDMChannel, StageChannel } from "discord.js";
import BreadClient from "../Classes/Client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReplaceReturnType<T extends (...a: any) => any, TNewReturn> = (...a: Parameters<T>) => TNewReturn;

// following BreadClient's naming scheme
export default interface BreadMessage extends Message {
    client: BreadClient;
    channel: Exclude<Message["channel"], StageChannel | PartialGroupDMChannel>; // reasons
    fetch: ReplaceReturnType<(force?: boolean) => Promise<Message>, Promise<BreadMessage>>;
}
