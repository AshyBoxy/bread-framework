import IReactionRoleConfig from "./ReactionRoleConfig";

export default interface IGuildConfig {
    prefix?: string;
    disabledCommands?: string[];
    // why does this still exist???
    reactionRoles?: IReactionRoleConfig[];
}
