import { Command } from "..";
import { RETURN_CODES } from "../constants";
import { ownerOnlyPermission } from "../Utils/discord";

export default new Command(async (bot, ctx) => {
    await bot.publishCommands();
    ctx.send("Published commands (check logs)");

    return RETURN_CODES.OK;
}, {
    name: "PublishCommands",
    userCompatible: false,
    messageOnly: true,
    advancedPermission: ownerOnlyPermission
});
