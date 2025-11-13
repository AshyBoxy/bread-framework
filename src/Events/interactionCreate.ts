import { Events, MessageFlags } from "discord.js";
import { Command, Utils } from "..";
import { ArgumentType, FlagArgument, NumericArgument, ParsedArguments } from "../Classes/Arguments";
import EventHandler from "../Classes/EventHandler";
import InteractionContext from "../Classes/InteractionContext";
import { ComponentInteractionBasedContext } from "../Interfaces/Context";

export default new EventHandler(Events.InteractionCreate, (bot) => async (int): Promise<void> => {
    if (int.isButton()) {
        const component = Command.parseComponentId(int.customId);
        if (component === null) {
            int.reply({ content: "unknown component??", flags: MessageFlags.Ephemeral });
            bot.logger.warn(`Could not parse button component id: ${int.customId}`);
            return;
        }

        const command = bot.commandById(component.commandId);
        if (!command) {
            int.reply({ content: "unknown command??", flags: MessageFlags.Ephemeral });
            bot.logger.warn(`Could not find command for component id: ${int.customId}, ${component.commandId}`);
            return;
        }

        if (!command.runComponent) {
            bot.logger.warn(`Command ${command.getFullId()} does not have a runComponent handler, but received a component interaction`);
            return;
        }

        await command.runComponent(bot, <ComponentInteractionBasedContext>new InteractionContext(int), component.subId, component.data);
        return;
    }
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
                // TODO: change mention to actually use the mention option type
                case ArgumentType.User:
                case ArgumentType.Mention:
                    args.add(arg, int.options.getUser(Command.getDiscordArgumentName(arg)));
                    break;
                case ArgumentType.Flag:
                    args.add(arg, int.options.getBoolean(Command.getDiscordArgumentName(arg)) ?? (<FlagArgument>arg).getDefaultValue());
                    break;
                case ArgumentType.Integer:
                    args.add(arg, int.options.getInteger(Command.getDiscordArgumentName(arg)) ?? (<NumericArgument<ArgumentType.Integer>>arg).getDefaultValue());
                    break;
                case ArgumentType.Number:
                    args.add(arg, int.options.getNumber(Command.getDiscordArgumentName(arg)) ?? (<NumericArgument<ArgumentType.Number>>arg).getDefaultValue());
                    break;
                default:
                    bot.logger.warn(`Unknown argument type ${arg.type} for ${Command.getArgumentName(arg)} in ${command.getName()}`);
                    break;
            }
        }

        if (command) Utils.discord.runCommand(bot, new InteractionContext(int), args, command);
        else int.reply("unknown command error");
    }
});
