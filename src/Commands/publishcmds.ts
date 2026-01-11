import { ArgumentsBuilder, Command } from "..";
import { RETURN_CODES } from "../constants";
import { ownerOnlyPermission } from "../Utils/discord";

export default new Command(async (bot, ctx, args) => {
    await bot.publishCommands([], args.getFlag("forceAll"));
    ctx.send("Published commands (check logs)");

    return RETURN_CODES.OK;
}, {
    name: "PublishCommands",
    userCompatible: false,
    messageOnly: true,
    advancedPermission: ownerOnlyPermission,
    args: new ArgumentsBuilder()
        .addFlag("forceAll", "f")
});
