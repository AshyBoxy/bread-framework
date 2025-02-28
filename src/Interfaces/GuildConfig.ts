export default interface IGuildConfig {
    prefix?: string;
    disabledCommands?: string[];
    userDisabledCommands?: Record<string, string[]>;
}
