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

export interface MAIN {
    SHUTTING_DOWN: (reason: string) => string;
    SIGINT: string;
    SIGTERM: string;
}

export interface IStrings {
    CLASSES: CLASSES;
    MAIN: MAIN;
}

export default IStrings;
