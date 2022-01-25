export interface CLASSES {
    CLIENT: {
        LOADED: {
            EVENTS: (events: string[]) => string;
            MODULES: (modules: string[]) => string;
        };
        WARNINGS: {
            COMMAND: (commandName: string, modulename: string) => string;
        };
    };
}

export interface UTILS {
    DISCORD: {
        DISABLED: string;
        GUILD_ONLY: string;
        DM_ONLY: string;
        BAD_PERMISSIONS: string;
        BOT_PERMISSIONS: string;
        BAD_USAGE: (prefix: string, usage: string) => string;
        ERROR: string;
    };
    REACT: {
        EMOJI: {
            NON_SHINY: string;
            SHINY: string;
            SQUARE_SHINY: string;
            GOLDEN: string;
        };
        SPECIAL_MESSAGES: {
            SHINY: (authorId: string) => string;
            SQUARE_SHINY: (authorId: string) => string;
            GOLDEN: (authorId: string) => string;
        };
        BLOCKED: string;
        ERROR: (error: { message: string; }) => string;
    };
}

export interface MAIN {
    SHUTTING_DOWN: (reason: string) => string;
    SIGINT: string;
    SIGTERM: string;
}

export interface EVENTS {
    READY: {
        ONLINE: (tag: string) => string;
        ACTIVITY_NAME: string;
    };
    MESSAGE: {
        PREFIX: (prefix: string) => string;
        HELLO: (authorId: string) => string;
    };
}

// make all commands have a data thing without explicitly adding it
// using Record or something
export interface COMMANDS {
    CONFIG: {
        PREFIX: {
            DATA: {
                NAME: string;
                USAGE: string;
                INFO: string;
            };
            TOO_LONG: (maxLength: number) => string;
        };
    };
    FUN: {
        AVATAR: {
            DATA: {
                NAME: string;
                USAGE: string;
                INFO: string;
                ALIASES: string[];
            };
        };
        BIBLE: {
            DATA: {
                NAME: string;
                USAGE: string;
                INFO: string;
            };
        },
        USER_INFO: {
            DATA: {
                NAME: string;
                USAGE: string;
                INFO: string;
            };
            JOINED_GUILD_TITLE: string;
            // JOINED_GUILD_BODY
            JOINED_DISCORD_TITLE: string;
        };
    };
    MOD: {
        CLEAR: {
            DATA: {
                NAME: string;
                USAGE: string;
                INFO: string;
            };
            DELETED_MESSAGES: (deletedCount: number) => string;
        };
    };
}

export interface IStrings {
    CLASSES: CLASSES;
    UTILS: UTILS;
    MAIN: MAIN;
    EVENTS: EVENTS;
    COMMANDS: COMMANDS;
}

export default IStrings;
