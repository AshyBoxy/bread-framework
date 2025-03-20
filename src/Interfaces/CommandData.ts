import { PermissionResolvable } from "discord.js";
import { Argument, ArgumentsBuilder } from "../Classes/Arguments";
import IModule from "./Module";

export default interface ICommandData {
    ns?: string;
    id?: string;
    name?: string;
    info?: string;
    usage?: string;
    aliases?: string[];

    disabled?: boolean;

    module?: IModule;

    interactionOnly?: boolean;
    messageOnly?: boolean;
    userCompatible?: boolean;
    userOnly?: boolean;

    args?: Argument[] | ArgumentsBuilder;

    permission?: PermissionResolvable;
    botPermission?: PermissionResolvable;
}
