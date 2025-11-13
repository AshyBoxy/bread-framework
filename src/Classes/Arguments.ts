/* eslint-disable @typescript-eslint/no-explicit-any */
import { User as DiscordUser } from "discord.js";
import { Command } from "..";

export enum ArgumentType {
    User,
    String,
    GreedyString,
    Flag,
    /**
     * msg.mentions.first()
     */
    // was originally intended to be used for any type of mention but only supports user mentions now
    /**
     * @deprecated Use ArgumentType.User instead
     */
    Mention,
    Integer,
    Number
}

export type NumericArgumentType = ArgumentType.Integer | ArgumentType.Number;

export interface ArgumentTypeValues {
    [ArgumentType.User]: DiscordUser;
    [ArgumentType.String]: string;
    [ArgumentType.GreedyString]: string;
    [ArgumentType.Flag]: boolean;
    [ArgumentType.Mention]: DiscordUser;
    [ArgumentType.Integer]: number;
    [ArgumentType.Number]: number;
}

export class Argument<type extends ArgumentType = any> {
    originalId: string;
    constructor(public type: type, public id: string, public required: boolean) {
        this.originalId = id;
    }
}

export interface DefaultingArgument<type extends ArgumentType> {
    getDefaultValue(): ArgumentTypeValues[type] | null;
}

export class BaseDefaultingArgument<type extends ArgumentType> extends Argument<type> implements DefaultingArgument<type> {
    constructor(type: type, id: string, required: boolean, private defVal: ArgumentTypeValues[type] | null) {
        super(type, id, required);
    }

    getDefaultValue(): ArgumentTypeValues[type] | null {
        return this.defVal;
    }
}

export class FlagArgument extends BaseDefaultingArgument<ArgumentType.Flag> {
    constructor(id: string, public shortName: string, defVal = false) {
        super(ArgumentType.Flag, id, false, defVal);
    }

    getDefaultValue(): boolean {
        return <boolean>super.getDefaultValue();
    }
}

export class NumericArgument<type extends NumericArgumentType> extends BaseDefaultingArgument<type> {
    constructor(type: type, id: string, required: boolean, public minimum: number | null = null, public maximum: number | null = null, defVal: number | null) {
        super(type, id, required, defVal);
    }
}


export class ArgumentsBuilder {
    private args: Argument[] = [];

    addUser(id?: string, required = false): this {
        if (this.args.find((x) => x.type === ArgumentType.Mention)) throw new Error("User arguments cannot be used with a mention argument");
        this.args.push(new Argument(ArgumentType.User, id || "", required));
        return this;
    }

    addString(id?: string, required = false): this {
        this.args.push(new Argument(ArgumentType.String, id || "", required));
        return this;
    }

    addGreedyString(id?: string, required = false): this {
        this.args.push(new Argument(ArgumentType.GreedyString, id || "", required));
        return this;
    }

    addFlag(id: string, shortName: string, defVal?: boolean): this {
        this.args.push(new FlagArgument(id, shortName, defVal));
        return this;
    }

    /**
     * @deprecated Use user arguments instead
     */
    addMention(id?: string, required = false): this {
        if (this.args.find((x) => x.type === ArgumentType.User || x.type === ArgumentType.Mention)) throw new Error("Mention arguments cannot be used with other mention or user arguments");
        this.args.push(new Argument(ArgumentType.Mention, id || "", required));
        return this;
    }

    addInteger(id?: string, required = false, minimum: number | null = null, maximum: number | null = null, defVal: number | null = null): this {
        this.args.push(new NumericArgument(ArgumentType.Integer, id || "", required, minimum, maximum, defVal));
        return this;
    }

    addNumber(id?: string, required = false, minimum: number | null = null, maximum: number | null = null, defVal: number | null = null): this {
        this.args.push(new NumericArgument(ArgumentType.Number, id || "", required, minimum, maximum, defVal));
        return this;
    }

    build(command: Command): Argument[] {
        const arr: Argument[] = [];
        for (const arg of this.args) {
            arg.id = `${command.getFullId()}.args.${arg.originalId}`;
            arr.push(arg);
        }
        return arr;
    }
}

// i can't figure out this one
export interface ParsedArgument<type extends ArgumentType = any> {
    type: type;
    arg: Argument;
    value: ArgumentTypeValues[type];
}

export class ParsedArguments {
    args: ParsedArgument[] = [];

    add<type extends ArgumentType>(arg: Argument<type>, value: ArgumentTypeValues[type]): this {
        this.args.push({
            type: arg.type,
            arg: arg,
            value
        });
        return this;
    }

    getUser(id?: string): ArgumentTypeValues[ArgumentType.User] | undefined {
        if (id) return this.args.find((x) => x.type === ArgumentType.User && x.arg.id === id || x.arg.originalId === id)?.value;
        return this.args.find((x) => x.type === ArgumentType.User)?.value;
    }

    getString(id?: string, defVal = null): ArgumentTypeValues[ArgumentType.String] | null {
        if (id) return this.args.find((x) => x.type === ArgumentType.String && x.arg.id === id || x.arg.originalId === id)?.value ?? defVal;
        return this.args.find((x) => x.type === ArgumentType.String)?.value ?? defVal;
    }

    getStringOrThrow(id?: string): ArgumentTypeValues[ArgumentType.String] {
        const val = this.getString(id, null);
        if (val === null) throw new Error(`String argument ${id ?? "(no id)"} not found`);
        return val;
    }

    getGreedyString(id?: string, defVal: string | null = null): ArgumentTypeValues[ArgumentType.GreedyString] | null {
        if (id) return this.args.find((x) => x.type === ArgumentType.GreedyString && x.arg.id === id || x.arg.originalId === id)?.value ?? defVal;
        return this.args.find((x) => x.type === ArgumentType.GreedyString)?.value ?? defVal;
    }

    getGreedyStringOrThrow(id?: string): ArgumentTypeValues[ArgumentType.GreedyString] {
        const val = this.getGreedyString(id, null);
        if (val === null) throw new Error(`GreedyString argument ${id ?? "(no id)"} not found`);
        return val;
    }

    getFlag(id?: string, defVal: boolean | null = false): ArgumentTypeValues[ArgumentType.Flag] {
        if (id) return this.args.find((x) => x.type === ArgumentType.Flag && x.arg.id === id || x.arg.originalId === id)?.value ?? defVal;
        return this.args.find((x) => x.type === ArgumentType.Flag)?.value ?? defVal;
    }

    /**
     * @deprecated Use user arguments instead
     */
    getMention(id?: string): ArgumentTypeValues[ArgumentType.Mention] | undefined {
        if (id) return this.args.find((x) => x.type === ArgumentType.Mention && x.arg.id === id || x.arg.originalId === id)?.value;
        return this.args.find((x) => x.type === ArgumentType.Mention)?.value;
    }

    getInteger(id?: string, defVal: number | null = null): ArgumentTypeValues[ArgumentType.Integer] | null {
        let arg: ParsedArgument<ArgumentType.Integer> | undefined;

        if (id) arg = this.args.find((x) => x.type === ArgumentType.Integer && x.arg.id === id || x.arg.originalId === id);
        else arg = this.args.find((x) => x.type === ArgumentType.Integer);

        return arg?.value ?? defVal;
    }
    getIntegerOrThrow(id?: string): number {
        const val = this.getInteger(id, null);
        if (val === null) throw new Error(`Integer argument ${id ?? "(no id)"} not found`);
        return val;
    }

    getNumber(id?: string, defVal: number | null = null): ArgumentTypeValues[ArgumentType.Number] | null {
        let arg: ParsedArgument<ArgumentType.Number> | undefined;

        if (id) arg = this.args.find((x) => x.type === ArgumentType.Number && x.arg.id === id || x.arg.originalId === id);
        else arg = this.args.find((x) => x.type === ArgumentType.Number);

        return arg?.value ?? defVal;
    }
    getNumberOrThrow(id?: string): number {
        const val = this.getNumber(id, null);
        if (val === null) throw new Error(`Number argument ${id ?? "(no id)"} not found`);
        return val;
    }
}
