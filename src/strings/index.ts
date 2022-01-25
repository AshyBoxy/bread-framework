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
    UTILS: {
        DISCORD: {
            DISABLED: "This command is currently disabled!",
            GUILD_ONLY: "This command can only be used in a server!",
            DM_ONLY: "This command can only be used in DMs!",
            BAD_PERMISSIONS: "You don't have the required permissions to use this command!",
            BOT_PERMISSIONS: "I don't have the required permissions to use this command!",
            BAD_USAGE: (prefix, usage): string => `Usage: ${prefix}${usage}`,
            ERROR: "There was an error processing that command! Please try again."
        },
        REACT: {
            EMOJI: {
                NON_SHINY: "🍞",
                SHINY: "718797512336474132",
                SQUARE_SHINY: "718797512449851502",
                GOLDEN: "919761954980106260"
            },
            SPECIAL_MESSAGES: {
                SHINY: (authorId) => `<@${authorId}> got shiny bread!`,
                SQUARE_SHINY: (authorId) => `<@${authorId}> got square shiny bread!`,
                GOLDEN: (authorId) => `<@${authorId}> got golden bread!`
            },
            BLOCKED: "unblock pls",
            ERROR: (error) => `congrats you made an error happen: ${error.message}`
        }
    },
    MAIN: {
        SHUTTING_DOWN: (reason): string => `Shutting Down: ${reason}`,
        SIGINT: "Recieved SIGINT",
        SIGTERM: "Recieved SIGTERM"
    },
    EVENTS: {
        READY: {
            ONLINE: (tag): string => `Online as ${tag}`,
            ACTIVITY_NAME: "All Hail Bread 🍞"
        },
        MESSAGE: {
            PREFIX: (prefix): string => `My prefix is \`${prefix}\``,
            HELLO: (author): string => `Oh Shit! What Up <@${author}>!`
        }
    },
    COMMANDS: {
        CONFIG: {
            PREFIX: {
                DATA: {
                    NAME: "Prefix",
                    USAGE: "prefix <prefix>",
                    INFO: "Sets the server's prefix"
                },
                TOO_LONG: (maxLength): string => `A prefix cannot be longer than ${maxLength} characters!`
            }
        },
        FUN: {
            AVATAR: {
                DATA: {
                    NAME: "Avatar",
                    USAGE: "avatar [@user]",
                    INFO: "Shows a user's avatar",
                    ALIASES: [
                        "av",
                        "a",
                        "pfp"
                    ]
                }
            },
            BIBLE: {
                DATA: {
                    NAME: "Bible",
                    USAGE: "bible",
                    INFO: "Bible."
                }
            },
            USER_INFO: {
                DATA: {
                    NAME: "UserInfo",
                    USAGE: "userinfo [@user]",
                    INFO: "Shows a user's information"
                },
                JOINED_GUILD_TITLE: "Joined Server At",
                JOINED_DISCORD_TITLE: "Joined Discord At"
            }
        },
        MOD: {
            CLEAR: {
                DATA: {
                    NAME: "Clear",
                    INFO: "Clears messages",
                    USAGE: "clear <amount of messages to clear (maximum of 50)>"
                },
                DELETED_MESSAGES: (deletedCount): string => `Deleted ${deletedCount} messages!`
            }
        }
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
const STRINGS = strings[selectedName];

export default STRINGS;
