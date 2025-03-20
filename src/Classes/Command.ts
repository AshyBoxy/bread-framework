import { ApplicationIntegrationType, InteractionContextType } from "discord-api-types/v10";
import { ApplicationCommandOptionBase, PermissionResolvable, SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandStringOption, SlashCommandUserOption } from "discord.js";
import { strings } from "..";
import { Context } from "../Interfaces/Context";
import IGeneralCommandData from "../Interfaces/GeneralCommandData";
import ILogger from "../Interfaces/Logger";
import IModule from "../Interfaces/Module";
import { Argument, ArgumentsBuilder, ArgumentType, ParsedArguments } from "./Arguments";
import Client from "./Client";

export type run = (this: Command, bot: Client, ctx: Context, args: ParsedArguments) => number | void | Promise<number | void>;

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

    messageOnly?: boolean;
    interactionOnly?: boolean;
    userCompatible: boolean;
    userOnly: boolean;
    args: Argument[] = [];

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

        this.messageOnly = data.messageOnly;
        this.interactionOnly = data.interactionOnly;
        this.userCompatible = data.userCompatible ?? !data.guildOnly;
        this.userOnly = data.userOnly ?? false;
        if (Array.isArray(data.args)) this.args = data.args;

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
        if (!this.id)
            return this.name;

        const ns = this.ns ?? this.module.ns;

        let id = "";
        if (ns)
            id = `${ns}.`;
        if (this.module.id)
            id += `${this.module.id}.`;
        id += this.id;

        return id;
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
        if (this.#data.args instanceof ArgumentsBuilder)
            this.args = this.#data.args.build(this);
    }

    createSlashCommand(logger: ILogger | null = null): SlashCommandBuilder {
        const slashCommand = new SlashCommandBuilder()
            .setDescription(this.getInfo())
            .setContexts(this.dmOnly ? [InteractionContextType.BotDM] : this.guildOnly ? [InteractionContextType.Guild] : [InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel]);
        try {
            slashCommand.setName(this.getName().toLowerCase().slice(0, 31) || "__broken");
        } catch {
            slashCommand.setName("__broken");
        }

        if (this.userOnly)
            slashCommand.setIntegrationTypes(ApplicationIntegrationType.UserInstall);
        else if (!this.userCompatible)
            slashCommand.setIntegrationTypes(ApplicationIntegrationType.GuildInstall);
        else
            slashCommand.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall);

        for (const arg of this.args)
            switch (arg.type) {
                case ArgumentType.String:
                case ArgumentType.GreedyString: {
                    const option = new SlashCommandStringOption();
                    this.setCommonSlashCommandOptions(arg, option);
                    slashCommand.addStringOption(option);
                    break;
                }
                case ArgumentType.User:
                case ArgumentType.Mention: {
                    const option = new SlashCommandUserOption();
                    this.setCommonSlashCommandOptions(arg, option);
                    slashCommand.addUserOption(option);
                    break;
                }
                case ArgumentType.Flag: {
                    const option = new SlashCommandBooleanOption();
                    this.setCommonSlashCommandOptions(arg, option);
                    slashCommand.addBooleanOption(option);
                    break;
                }
                default:
                    logger?.warn(`Unknown argument type ${arg.type} for ${Command.getArgumentName(arg)} in ${this.getName()}`);
                    break;
            }


        return slashCommand;
    }

    static getArgumentName(arg: Argument): string {
        return strings.get(arg.id);
    }

    static getArgumentDescription(arg: Argument): string {
        return strings.get(`${arg.id}.desc`);
    }

    static getDiscordArgumentName(arg: Argument): string {
        let name = this.getArgumentName(arg).replaceAll(".", "_");
        if (name.length > 31)
            name = `_toolong_${name.slice(-9)}`;
        return name;
    }

    private setCommonSlashCommandOptions(arg: Argument, command: ApplicationCommandOptionBase): void {
        command
            .setName(Command.getDiscordArgumentName(arg))
            .setDescription(Command.getArgumentDescription(arg))
            .setRequired(arg.required);
    }
}

export default Command;
