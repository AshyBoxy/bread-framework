import { GuildContext } from "../Interfaces/Context";
import IGeneralCommandData from "../Interfaces/GeneralCommandData";
import IGuildCommandData from "../Interfaces/GuildCommandData";
import { ParsedArguments } from "./Arguments";
import Client from "./Client";
import Command, { run } from "./Command";

export type guildRun = (this: GuildCommand, bot: Client, ctx: GuildContext, args: ParsedArguments) => number | void | Promise<number | void>;

class GuildCommand extends Command {
    constructor(execute: guildRun, data: IGuildCommandData) {
        const commandData: IGeneralCommandData = data;
        commandData.guildOnly = true;
        super(<run>execute, commandData);
    }
}

export default GuildCommand;
