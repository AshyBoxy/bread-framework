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
    Mention
}

export interface ArgumentTypeValues {
    [ArgumentType.User]: DiscordUser;
    [ArgumentType.String]: string;
    [ArgumentType.GreedyString]: string;
    [ArgumentType.Flag]: boolean;
}

export class Argument<type extends ArgumentType = any> {
    originalId: string;
    constructor(public type: type, public id: string, public required: boolean) {
        this.originalId = id;
    }
}

export class FlagArgument extends Argument {
    constructor(id: string, public shortName: string, public defVal = false) {
        super(ArgumentType.Flag, id, false);
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

    addMention(id?: string, required = false): this {
        if (this.args.find((x) => x.type === ArgumentType.User || x.type === ArgumentType.Mention)) throw new Error("Mention arguments cannot be used with other mention or user arguments");
        this.args.push(new Argument(ArgumentType.Mention, id || "", required));
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

    getUser(id?: string): DiscordUser | undefined {
        if (id) return this.args.find((x) => x.type === ArgumentType.User && x.arg.id === id || x.arg.originalId === id)?.value;
        return this.args.find((x) => x.type === ArgumentType.User)?.value;
    }

    getString(id?: string, defVal = ""): string {
        if (id) return this.args.find((x) => x.type === ArgumentType.String && x.arg.id === id || x.arg.originalId === id)?.value ?? defVal;
        return this.args.find((x) => x.type === ArgumentType.String)?.value ?? defVal;
    }

    getGreedyString(id?: string, defVal = ""): string {
        if (id) return this.args.find((x) => x.type === ArgumentType.GreedyString && x.arg.id === id || x.arg.originalId === id)?.value ?? defVal;
        return this.args.find((x) => x.type === ArgumentType.GreedyString)?.value ?? defVal;
    }

    getFlag(id?: string, defVal: boolean | null = false): boolean {
        if (id) return this.args.find((x) => x.type === ArgumentType.Flag && x.arg.id === id || x.arg.originalId === id)?.value ?? defVal;
        return this.args.find((x) => x.type === ArgumentType.Flag)?.value ?? defVal;
    }

    getMention(): DiscordUser | undefined {
        return this.args.find((x) => x.type === ArgumentType.Mention)?.value;
    }
}
