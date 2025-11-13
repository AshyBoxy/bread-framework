import { Events, MessageFlags } from "discord.js";
import { Command, Utils } from "..";
import { ArgumentType, FlagArgument, ParsedArguments } from "../Classes/Arguments";
import EventHandler from "../Classes/EventHandler";
import InteractionContext from "../Classes/InteractionContext";

export default new EventHandler(Events.InteractionCreate, (bot) => (int): void => {
    if (int.isButton())
        int.reply(`i don't know how to handle buttons (${int.user.displayName} pressed it)`);
    else if (int.isChatInputCommand()) {
        // int.reply("how do commands work");
        // TODO: just this entirely, but also commandByName
        // although this should probably search on something slightly different
        const cmd = int.commandName.toLowerCase();
        const command = bot.commandByName(cmd);

        if (!command) return void int.reply({ content: "unknown command??", flags: MessageFlags.Ephemeral });

        const args = new ParsedArguments();

        for (const arg of command.args) {
            if (arg.required && !int.options.get(Command.getDiscordArgumentName(arg))) return void int.reply({ content: "missing a required argument??", flags: MessageFlags.Ephemeral });
            switch (arg.type) {
                case ArgumentType.String:
                case ArgumentType.GreedyString:
                    args.add(arg, int.options.getString(Command.getDiscordArgumentName(arg)));
                    break;
                case ArgumentType.User:
                case ArgumentType.Mention:
                    args.add(arg, int.options.getUser(Command.getDiscordArgumentName(arg)))
                    break
                case ArgumentType.Flag:
                    args.add(arg, int.options.getBoolean(Command.getDiscordArgumentName(arg)) ?? (<FlagArgument>arg).defVal)
                    break
                default:
                    bot.logger.warn(`Unknown argument type ${arg.type} for ${Command.getArgumentName(arg)} in ${command.getName()}`)
                    break;
            }
        }

        if (command) Utils.discord.runCommand(bot, new InteractionContext(int), args, command);
        else int.reply("unknown command error");
    }
});
