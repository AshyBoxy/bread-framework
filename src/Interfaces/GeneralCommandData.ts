import ICommandData from "./CommandData";

export default interface IGeneralCommandData extends ICommandData {
    guildOnly?: boolean;
    dmOnly?: boolean;
}
