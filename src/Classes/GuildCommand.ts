import IGeneralCommandData from "../Interfaces/GeneralCommandData";
import IGuildCommandData from "../Interfaces/GuildCommandData";
import IGuildMessage from "../Interfaces/GuildMessage";
import Client from "./Client";
import Command, { run } from "./Command";

class GuildCommand extends Command {
    constructor(execute: (bot: Client, message: IGuildMessage, args: string[]) => number | void | Promise<number | void>, data: IGuildCommandData) {
        const commandData: IGeneralCommandData = data;
        commandData.guildOnly = true;
        super(<run>execute, commandData);
    }
}

export default GuildCommand;
