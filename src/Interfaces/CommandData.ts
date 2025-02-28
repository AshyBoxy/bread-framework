import { PermissionResolvable } from "discord.js";
import IInteractionArgument from "./InteractionArgument";
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

    args?: {
        required?: IInteractionArgument[]; // yooo this is a cool type
        optional?: IInteractionArgument[];
    };

    permission?: PermissionResolvable;
    botPermission?: PermissionResolvable;
}
