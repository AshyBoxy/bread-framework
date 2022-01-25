import { ClientEvents } from "discord.js";
import CustomMessage from "../Interfaces/Message";
import CustomClient from "./Client";

interface IEvents extends ClientEvents {
    messageCreate: [message: CustomMessage];
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
