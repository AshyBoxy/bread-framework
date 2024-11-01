import { InteractionContextType } from "discord-api-types/v10";
import { ChatInputCommandInteraction, PartialGroupDMChannel, PermissionResolvable, SlashCommandBuilder, TextBasedChannel } from "discord.js";
import IGeneralCommandData from "../Interfaces/GeneralCommandData";
import BreadMessage from "../Interfaces/Message";
import IModule from "../Interfaces/Module";
import Client from "./Client";

export type run = (bot: Client, message: BreadMessage | (ChatInputCommandInteraction & { channel: Exclude<TextBasedChannel, PartialGroupDMChannel>; }), args: string[]) => number | void | Promise<number | void>;

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

    slashCommand: SlashCommandBuilder;

    module: IModule = {
        name: "None",
        path: "none",
        description: "Placeholder module"
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

        this.slashCommand = new SlashCommandBuilder()
            .setName(this.name.toLowerCase())
            .setDescription(this.info)
            .setContexts(this.dmOnly ? [InteractionContextType.BotDM] : this.guildOnly ? [InteractionContextType.Guild] : [InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]);

        if (this.guildOnly && this.dmOnly) throw new Error(`${this.name} is both a dm and guild only command?`);
    }
}

export default Command;
