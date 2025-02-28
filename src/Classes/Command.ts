import { InteractionContextType } from "discord-api-types/v10";
import { ChatInputCommandInteraction, PartialGroupDMChannel, PermissionResolvable, SlashCommandBuilder, TextBasedChannel } from "discord.js";
import IGeneralCommandData from "../Interfaces/GeneralCommandData";
import BreadMessage from "../Interfaces/Message";
import IModule from "../Interfaces/Module";
import Client from "./Client";
import { strings } from "..";

export type run = (this: Command, bot: Client, message: BreadMessage | (ChatInputCommandInteraction & { channel: Exclude<TextBasedChannel, PartialGroupDMChannel>; }), args: string[]) => number | void | Promise<number | void>;

class Command implements IGeneralCommandData {

    run: run;

    #data: IGeneralCommandData;

    ns: string;
    id: string;
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

    constructor(execute: run, data: IGeneralCommandData = {}) {
        this.run = execute;

        this.#data = data;

        // what the flip typescript?
        this.name = "";
        this.info = "";
        this.usage = "";

        // should be updated when loaded
        this.ns = <string>data.ns;
        this.id = <string>data.id;
        this.updateNs();
        this.aliases = data.aliases || [];
        this.disabled = data.disabled || false;
        this.guildOnly = data.guildOnly || false;
        this.dmOnly = data.dmOnly || false;
        this.permission = data.permission || [];
        this.botPermission = data.botPermission || [];

        this.slashCommand = new SlashCommandBuilder()
            .setDescription(this.info)
            .setContexts(this.dmOnly ? [InteractionContextType.BotDM] : this.guildOnly ? [InteractionContextType.Guild] : [InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]);
        try {
            this.slashCommand.setName(this.getName().toLowerCase().slice(0, 31) || "__broken");
        } catch {
            this.slashCommand.setName("__broken");
        }

        if (this.guildOnly && this.dmOnly) throw new Error(`${this.name} is both a dm and guild only command?`);
    }

    getName(): string {
        return strings.get(this.name);
    }

    getInfo(): string {
        return strings.get(this.info);
    }

    getUsage(): string {
        return strings.get(this.usage);
    }

    getFullId(): string {
        if (this.ns && this.id) return `${this.ns}.${this.id}`;
        if (this.id) return this.id;
        return this.name;
    }

    private updateNs(): void {
        const moduleId = this.module.id ? `.${this.module.id}` : "";

        this.name = this.#data.name || `${this.ns}.commands${moduleId}.${this.id}.name`;
        this.info = this.#data.info || `${this.ns}.commands${moduleId}.${this.id}.info`;
        this.usage = this.#data.usage || `${this.ns}.commands${moduleId}.${this.id}.usage`;
    }

    setNs(ns?: string, id?: string): void {
        if (!this.ns && ns) this.ns = ns;
        if (!this.id && id) this.id = id;

        this.updateNs();
    }
}

export default Command;
