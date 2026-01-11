import { Command, strings } from "..";
import BreadClient from "../Classes/Client";
import ILogger from "../Interfaces/Logger";
import BreadMessage from "../Interfaces/Message";

export interface HooksType {
    [Hooks.MessageCreate]?: {
        [HookPhases.Immediately]?: ((bot: BreadClient, msg: BreadMessage) => Promise<HOOK_CODES> | HOOK_CODES)[];
        [HookPhases.BeforeCommand]?: ((bot: BreadClient, msg: BreadMessage, cmd: string, args: string[], prefix: string) => Promise<HOOK_CODES> | HOOK_CODES)[];
        [HookPhases.NotCommand]?: ((bot: BreadClient, msg: BreadMessage, cmd: string, args: string[]) => Promise<HOOK_CODES> | HOOK_CODES)[];
        [HookPhases.Command]?: ((bot: BreadClient, msg: BreadMessage, command: Command, args: string[], prefix: string) => Promise<HOOK_CODES> | HOOK_CODES)[];
    };
    [Hooks.ClientReady]?: {
        [HookPhases.Immediately]?: ((bot: BreadClient) => Promise<HOOK_CODES> | HOOK_CODES)[];
    }
};

export enum Hooks {
    MessageCreate = "messageCreate",
    ClientReady = "clientReady"
}

export enum HookPhases {
    Immediately = "immediately",
    BeforeCommand = "beforeCommand",
    NotCommand = "notCommand",
    // eslint-disable-next-line @typescript-eslint/no-shadow
    Command = "command",
    Test = "test"
}

type HookPhaseMap<H extends Hooks> = NonNullable<HooksType[H]>;
export type HookPhasesFor<H extends Hooks> = keyof HookPhaseMap<H>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HookFn<H extends Hooks, P extends HookPhasesFor<H>> = Extract<NonNullable<HookPhaseMap<H>[P]> extends (infer F)[] ? F : never, (...args: any) => any>;

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
