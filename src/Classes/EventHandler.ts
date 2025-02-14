import { ClientEvents, MessageReaction, MessageReactionEventDetails, Partialize, PartialUser, User } from "discord.js";
import BreadMessage from "../Interfaces/Message";
import BreadClient from "./Client";

// I think there's a better way to do this but I can't find it
interface BreadMessageReaction extends MessageReaction {
    message: BreadMessage;
}
type PartialBreadMessageReaction = Partialize<BreadMessageReaction, "count">;

interface IEvents extends ClientEvents {
    messageCreate: [message: BreadMessage];
    messageReactionAdd: [reaction: BreadMessageReaction | PartialBreadMessageReaction, user: User | PartialUser, details: MessageReactionEventDetails];
}
type Events = keyof IEvents;

type Execute<EventName extends Events> = (bot: BreadClient) => (...args: IEvents[EventName]) => void;

class EventHandler<EventName extends Events> {
    execute: Execute<EventName>;

    name: EventName;

    constructor(name: EventName, execute: Execute<EventName>) {
        this.execute = execute;
        this.name = name;
    }
}

export default EventHandler;
