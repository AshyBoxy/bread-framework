import IStrings from "./Strings";

const _STRINGS: IStrings = {
    CLASSES: {
        CLIENT: {
            LOADED: {
                EVENTS: (events): string => `loaded events: ${events.join(", ")}`,
                MODULES: (modules): string => `loaded modules: ${modules.join("; ")}`
            },
            WARNINGS: {
                COMMAND: (cmdName, moduleName): string =>
                    `command ${cmdName} in module ${moduleName} has no run function or name`
            }
        }
    },
    MAIN: {
        SHUTTING_DOWN: (reason): string => `Shutting Down: ${reason}`,
        SIGINT: "Recieved SIGINT",
        SIGTERM: "Recieved SIGTERM"
    }
};

// this thing is a mess of ugly hacks
const _TEST_STRINGS_NOOP = (): void => { /* */ };
const _TEST_STRINGS_HANDLER = (target: never, property: never): unknown => {
    // assuming top level isn't a string
    if (!_STRINGS[property]) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentObj = <any>_STRINGS[property];
    const innerHandler = (innerTarget: never, innerProperty: never): unknown => {
        if (!currentObj[innerProperty]) return undefined;
        if (typeof currentObj[innerProperty] === "object") {
            currentObj = currentObj[innerProperty];
            return new Proxy(_TEST_STRINGS_NOOP, { get: innerHandler });
        }

        // blacklist
        if (currentObj.NON_SHINY) return currentObj[innerProperty];

        // apply changes here
        if (typeof currentObj[innerProperty] === "function")
            return (...args: never[]): unknown =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                `test_${(<Record<string, any>>currentObj)[<string>innerProperty](...args)}`;
        if (typeof currentObj[innerProperty] === "string") return `test_${currentObj[innerProperty]}`;
        return currentObj[innerProperty];
    };
    return new Proxy(_TEST_STRINGS_NOOP, { get: innerHandler });
};
const _TEST_STRINGS: IStrings = <never>(new Proxy(_TEST_STRINGS_NOOP, {
    get: _TEST_STRINGS_HANDLER
}));

const strings: Record<string, IStrings> = {
    STRINGS: _STRINGS,
    TEST: _TEST_STRINGS
};
const selectedName = "STRINGS";
// const selectedName = "TEST";
// const STRINGS = strings[selectedName];
const oldStrings = strings[selectedName];

import newstrings from "./newstrings";

// we have both old and new systems on the same object for now
const STRINGS = Object.assign({}, oldStrings, newstrings);

export default STRINGS;

// export { default } from "./newstrings";
