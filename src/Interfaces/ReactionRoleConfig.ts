import { Collection } from "discord.js";

export default interface IReactionRoleConfig {
    messageId: string;
    roles: Collection<string, {
        role: string,
        reaction: string
    }>;
}
