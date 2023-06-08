// command return codes
// export const RETURN_CODES = {
//     OK: 0,
//     BAD_USAGE: 1,
//     ERROR: 2
// };

export enum RETURN_CODES {
    OK,
    BAD_USAGE,
    ERROR
}

export enum HOOK_CODES {
    OK,
    CONTINUE = OK,
    STOP
}
