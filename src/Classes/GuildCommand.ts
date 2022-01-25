import { Message } from "discord.js";
import IGeneralCommandData from "../Interfaces/GeneralCommandData";
import IGuildCommandData from "../Interfaces/GuildCommandData";
import Client from "./Client";
import Command from "./Command";
import IGuildMessage from "../Interfaces/GuildMessage";

class GuildCommand extends Command {
    constructor(execute: (bot: Client, message: IGuildMessage, args: string[]) => number | void | Promise<number | void>, data: IGuildCommandData) {
        const commandData: IGeneralCommandData = data;
        commandData.guildOnly = true;
        super(<(bot: Client, message: Message, args: string[]) => number | void | Promise<number | void>>execute, commandData);
    }
}

export default GuildCommand;
