import { ApplicationIntegrationType, InteractionContextType } from "discord-api-types/v10";
import { ApplicationCommandOptionBase, PermissionResolvable, SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandNumberOption, SlashCommandStringOption, SlashCommandUserOption } from "discord.js";
import { strings } from "..";
import { ComponentInteractionBasedContext, Context } from "../Interfaces/Context";
import IGeneralCommandData from "../Interfaces/GeneralCommandData";
import ILogger from "../Interfaces/Logger";
import IModule from "../Interfaces/Module";
import { Argument, ArgumentsBuilder, ArgumentType, NumericArgument, ParsedArguments } from "./Arguments";
import Client from "./Client";

export type run = (this: Command, bot: Client, ctx: Context, args: ParsedArguments) => number | void | Promise<number | void>;
export type advancedCheck = (this: Command, bot: Client, ctx: Context) => boolean | Promise<boolean>;
export type runComponent = (this: Command, bot: Client, ctx: ComponentInteractionBasedContext, id: string, data: string[]) => void | Promise<void>;

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
    advancedPermission?: advancedCheck;
    runComponent?: runComponent;

    messageOnly?: boolean;
    interactionOnly?: boolean;
    userCompatible: boolean;
    userOnly: boolean;
    args: Argument[] = [];

    tmpUnsupportedMessageArgs = false;

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
        this.advancedPermission = data.advancedPermission;
        this.runComponent = data.runComponent;

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
        if (this.#data.args instanceof ArgumentsBuilder) {
            this.args = this.#data.args.build(this);
            // TODO: implement integer and number args in messageCreate
            if (!this.interactionOnly)
                for (const arg of this.args)
                    if (arg.type === ArgumentType.Integer || arg.type === ArgumentType.Number)
                        if (arg.required) {
                            this.interactionOnly = true;
                            this.tmpUnsupportedMessageArgs = true;
                        }
        }
    }

    createSlashCommand(logger: ILogger | null = null): {
        builder: SlashCommandBuilder;
        args: Record<string, string>;
    } {
        let description = this.getInfo().replaceAll("\n", " ").replaceAll("\t", " "); // newlines and tabs get removed by discord
        if (description.length < 1) description = "no description (error)";
        else if (description.length > 100) description = `${description.slice(0, 85)} (truncated)`;

        const slashCommand = new SlashCommandBuilder()
            .setDescription(description)
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

        const args: Record<string, string> = {};
        for (const arg of this.args)
            switch (arg.type) {
                case ArgumentType.String:
                case ArgumentType.GreedyString: {
                    const option = new SlashCommandStringOption();
                    this.setCommonSlashCommandOptions(arg, option, args);
                    slashCommand.addStringOption(option);
                    break;
                }
                case ArgumentType.User:
                case ArgumentType.Mention: {
                    const option = new SlashCommandUserOption();
                    this.setCommonSlashCommandOptions(arg, option, args);
                    slashCommand.addUserOption(option);
                    break;
                }
                case ArgumentType.Flag: {
                    const option = new SlashCommandBooleanOption();
                    this.setCommonSlashCommandOptions(arg, option, args);
                    slashCommand.addBooleanOption(option);
                    break;
                }
                case ArgumentType.Integer: {
                    if (!(arg instanceof NumericArgument)) break; // hm.
                    const option = new SlashCommandIntegerOption();
                    this.setCommonSlashCommandOptions(arg, option, args);
                    if (arg.minimum !== null) option.setMinValue(arg.minimum);
                    if (arg.maximum !== null) option.setMaxValue(arg.maximum);
                    slashCommand.addIntegerOption(option);
                    break;
                }
                case ArgumentType.Number: {
                    if (!(arg instanceof NumericArgument)) break;
                    const option = new SlashCommandNumberOption();
                    this.setCommonSlashCommandOptions(arg, option, args);
                    if (arg.minimum !== null) option.setMinValue(arg.minimum);
                    if (arg.maximum !== null) option.setMaxValue(arg.maximum);
                    slashCommand.addNumberOption(option);
                    break;
                }

                default:
                    logger?.warn(`Unknown argument type ${arg.type} for ${Command.getArgumentName(arg)} in ${this.getName()}`);
                    break;
            }


        return { builder: slashCommand, args };
    }

    static getArgumentName(arg: Argument): string {
        return strings.get(arg.id);
    }

    static getArgumentDescription(arg: Argument): string {
        return strings.get(`${arg.id}.desc`);
    }

    static getDiscordArgumentName(arg: Argument): string {
        let name = this.getArgumentName(arg).replaceAll(".", "_").toLowerCase();
        if (name.length > 31) {
            // eslint-disable-next-line no-console
            console.error(`argument name ${name} too long`)
            name = `_toolong_${name.slice(-9)}`;
        }
        return name;
    }

    private setCommonSlashCommandOptions(arg: Argument, command: ApplicationCommandOptionBase, args: Record<string, string>): void {
        const name = Command.getDiscordArgumentName(arg);
        args[arg.id] = name;
        command
            .setName(name)
            .setDescription(Command.getArgumentDescription(arg))
            .setRequired(arg.required);
    }

    makeComponentId(subId = "", data: string[] = []): string {
        let id = `${this.getFullId()}:${subId}`;
        if (data.find((d) => d.includes(":"))) throw new Error("Component data cannot include :");
        if (data.length > 0) id += `:${data.join(":")}`;
        if (id.length > 100) throw new Error("Component id too long");
        return id;
    }

    static parseComponentId(id: string): { commandId: string; subId: string; data: string[]; } | null {
        const parts = id.split(":");
        if (parts.length < 2) return null;
        const commandId = parts[0];
        const subId = parts[1];
        const data = parts.slice(2);
        return { commandId, subId, data };
    }
}

export default Command;
