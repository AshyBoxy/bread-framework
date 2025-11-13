import { Command, strings } from "..";
import BreadClient from "../Classes/Client";
import IDatabase from "../Interfaces/Database";
import ILogger from "../Interfaces/Logger";
import BreadMessage from "../Interfaces/Message";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HooksType<Databases extends Record<string, IDatabase<any>>> = {
    messageCreate?: {
        immediately?: ((bot: BreadClient<Databases>, msg: BreadMessage) => Promise<HOOK_CODES> | HOOK_CODES)[];
        beforeCommand?: ((bot: BreadClient<Databases>, msg: BreadMessage, cmd: string, args: string[], prefix: string) => Promise<HOOK_CODES> | HOOK_CODES)[];
        notCommand?: ((bot: BreadClient<Databases>, msg: BreadMessage, cmd: string, args: string[]) => Promise<HOOK_CODES> | HOOK_CODES)[];
        command?: ((bot: BreadClient<Databases>, msg: BreadMessage, command: Command, args: string[], prefix: string) => Promise<HOOK_CODES> | HOOK_CODES)[];
    };
};

export enum HOOK_CODES {
    OK,
    CONTINUE = OK,
    STOP
}

let hookLogger: ILogger;

/**
 * @returns whether any hooks indicated to stop
 */
export async function runHooks<F extends (...args: Parameters<F>) => Promise<HOOK_CODES> | HOOK_CODES>(name: string, hooks: F[] = [], ...args: Parameters<F>): Promise<boolean> {
    let hookResult: HOOK_CODES;
    for (const hook of hooks)
        switch (hookResult = await hook(...args)) {
            case HOOK_CODES.OK:
            case HOOK_CODES.CONTINUE:
                break;
            case HOOK_CODES.STOP:
                return true;
            default:
                hookLogger?.debug(strings.get("bread_framework.hooks.bad_return", hookResult, name, hook.name || "with unknown name"));
        }

    return false;
}

export function setHookLogger(logger: ILogger): void {
    hookLogger = logger;
}
