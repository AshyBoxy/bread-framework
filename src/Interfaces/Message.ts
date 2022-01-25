import { Message } from "discord.js";
import CustomClient from "../Classes/Client";

// following CustomClient's naming scheme
export default interface CustomMessage extends Message {
    client: CustomClient;
}
