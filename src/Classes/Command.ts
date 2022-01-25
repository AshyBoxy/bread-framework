import { Message, PermissionResolvable } from "discord.js";
import Client from "./Client";
import IGeneralCommandData from "../Interfaces/GeneralCommandData";
import IModule from "../Interfaces/Module";

type run = (bot: Client, message: Message, args: string[]) => number | void | Promise<number | void>;

class Command implements IGeneralCommandData {

    run: run;

    name: string;
    info: string;
    usage: string;
    aliases: string[];
    disabled: boolean;
    guildOnly: boolean;
    dmOnly: boolean;
    permission: PermissionResolvable;
    botPermission: PermissionResolvable;

    module: IModule = {
        name: "None",
        path: "none",
        description: "Not part of a module???"
    };

    constructor(execute: run, data: IGeneralCommandData) {
        this.run = execute;

        this.name = data.name;
        this.info = data.info || `${data.name}`;
        this.usage = data.usage || `${data.name}`;
        this.aliases = data.aliases || [];
        this.disabled = data.disabled || false;
        this.guildOnly = data.guildOnly || false;
        this.dmOnly = data.dmOnly || false;
        this.permission = data.permission || [];
        this.botPermission = data.botPermission || [];
    }
}

export default Command;
