import { ApplicationCommandOptionType } from "discord.js";

type InteractionArgumentType = Exclude<ApplicationCommandOptionType, "SUB_COMMAND" | "SUB_COMMAND_GROUP">;

export default interface IInteractionArgument {
    name: string;
    type: InteractionArgumentType;
}
