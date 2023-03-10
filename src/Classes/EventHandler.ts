import { ClientEvents, MessageReaction, Partialize, PartialUser, User } from "discord.js";
import CustomMessage from "../Interfaces/Message";
import CustomClient from "./Client";

// I think there's a better way to do this but I can't find it
interface CustomMessageReaction extends MessageReaction {
    message: CustomMessage;
}
type PartialCustomMessageReaction = Partialize<CustomMessageReaction, "count">;

interface IEvents extends ClientEvents {
    messageCreate: [message: CustomMessage];
    messageReactionAdd: [reaction: CustomMessageReaction | PartialCustomMessageReaction, user: User | PartialUser];
}
type Events = keyof IEvents;

type Execute<EventName extends Events> = (bot: CustomClient) => (...args: IEvents[EventName]) => void;

class EventHandler<EventName extends Events> {
    execute: Execute<EventName>;

    name: EventName;

    constructor(name: EventName, execute: Execute<EventName>) {
        this.execute = execute;
        this.name = name;
    }
}

export default EventHandler;
