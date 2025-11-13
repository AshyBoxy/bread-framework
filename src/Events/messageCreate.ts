import { Events } from "discord.js";
import { BreadClient, BreadMessage, Command, EventHandler, IGuildConfig, MessageContext, strings } from "../..";
import { Argument, ArgumentType, FlagArgument, NumericArgument, ParsedArguments } from "../Classes/Arguments";
import * as utils from "../Utils";
import { runHooks } from "../Utils/hooks";
import { userRegex } from "../Utils/mentions";

// should guildConfig be in a bread only hook?

export default new EventHandler(Events.MessageCreate, (bot) => async (msg): Promise<void> => {
    if (await runHooks("messageCreate.immediately", bot.hooks.messageCreate?.immediately, bot, msg)) return;
    if (msg.author.bot) return;

    let guildConfig: IGuildConfig | undefined;
    if (msg.guild) {
        guildConfig = await bot.dbs.guildConfigs.get(msg.guild.id);
        if (!guildConfig) {
            guildConfig = {
                prefix: bot.config.prefix || "!",
                disabledCommands: []
            };
            bot.dbs.guildConfigs.set(msg.guild.id, guildConfig);
        }
    }

    const msgArr = msg.content.split(" ");
    let cmd = msgArr[0].toLowerCase();
    let args = msgArr.slice(1);

    let prefix = guildConfig?.prefix || bot.config.prefix || "!";

    if (!cmd) return;

    if (new RegExp(`^<@!?${bot.user?.id}>$`).test(cmd)) {
        if (!msgArr[1]) return msg.channel.send(strings.get("bread_framework.events.message.prefix", prefix)), undefined;
        cmd = msgArr[1].toLowerCase();
        args = msgArr.slice(2);
        prefix = "";
    }

    if (await runHooks("messageCreate.beforeCommand", bot.hooks.messageCreate?.beforeCommand, bot, msg, cmd, args, prefix)) return;

    if (cmd.startsWith(prefix)) {
        cmd = cmd.slice(prefix.length);

        const command = bot.commandByName(cmd);

        if (command && !command.interactionOnly) {
            if (await runHooks("messageCreate.command", bot.hooks.messageCreate?.command, bot, msg, command, args, prefix)) return;
            if (command.args.length < 1)
                utils.discord.runCommand(bot, new MessageContext(msg), args, command);
            else {
                let a: ParseArgumentsReturn;
                try {
                    a = await parseArguments(bot, command, args.join(" "), msg);
                } catch (e) {
                    msg.reply(strings.get("bread_framework.utils.discord.bad_usage", prefix, command.getUsage()));
                    return;
                }

                utils.discord.runCommand(bot, new MessageContext(msg), a.args, command);

                return;
            }
        }
    }

    runHooks("messageCreate.notCommand", bot.hooks.messageCreate?.notCommand, bot, msg, cmd, args);
});

interface ParseArgumentsReturn { args: ParsedArguments, message: string; }

async function parseArguments(bot: BreadClient, command: Command, message: string, msg: BreadMessage): Promise<ParseArgumentsReturn> {
    const args = new ParsedArguments();

    const userArgs = command.args.filter((x) => x.type === ArgumentType.User);
    const flagArgs = <FlagArgument[]>command.args.filter((x) => x.type === ArgumentType.Flag);
    const stringArgs = command.args.filter((x) => x.type === ArgumentType.String);
    const greedyStringArg = command.args.filter((x) => x.type === ArgumentType.GreedyString)[0];
    const integerArgs = <NumericArgument<ArgumentType.Integer>[]>command.args.filter((x) => x.type === ArgumentType.Integer);
    const numberArgs = <NumericArgument<ArgumentType.Number>[]>command.args.filter((x) => x.type === ArgumentType.Number);
    let mentionArg: Argument<ArgumentType.Mention> | undefined = command.args.filter((x) => x.type === ArgumentType.Mention)[0];

    const stringSplit = message.split("\"");

    const spaced = stringSplit[0].split(" ");

    for (let i = 0; i < spaced.length; i++) {
        // users
        const mention = spaced[i].match(userRegex);
        if (mention && userArgs.length > 0) {
            const a = <Argument>userArgs.shift();
            if (!a) throw new Error();

            args.add(a, await bot.users.fetch(mention[1]));
            spaced.shift();
            i--;
            continue;
        }
        if (mention && mentionArg) {
            args.add(mentionArg, await bot.users.fetch(mention[1]));
            mentionArg = undefined;
            spaced.shift();
            i--;
            continue;
        }


        // short flags
        if (spaced[i].startsWith("-")) {
            const flags = spaced.shift()?.split("") || "";
            i--;

            for (const f of flags) {
                const flagIndex = flagArgs.findIndex((x) => x.shortName === f);
                // eat any unknown flags
                if (flagIndex < 0) continue;
                const arg = flagArgs[flagIndex];
                flagArgs.splice(flagIndex, 1);
                args.add(arg, !arg.getDefaultValue());
            }
            continue;
        }
    }

    // TODO:
    // strings
    // integers and numbers
    for (const a of [...integerArgs, ...numberArgs]) {
        const def = a.getDefaultValue();
        if (def === null && a.required) throw new Error("Got required numeric argument in messageCreate");
        args.add(a, def);
    }

    // leftover
    for (const a of flagArgs) args.add(a, a.getDefaultValue());
    if (mentionArg && !args.getMention()) args.add(mentionArg, msg.mentions.users.first());

    stringSplit[0] = spaced.join(" ");
    const newMessage = stringSplit.join("\"");

    // greedy string
    if (greedyStringArg) {
        if (greedyStringArg.required && newMessage.length < 1) throw new Error();
        args.add(greedyStringArg, newMessage);
    }

    return { args, message: newMessage };
}
