type LogFunction = (message: string | string[], extra?: Record<string, unknown>) => void;

export default interface ILogger {
    log: (prefix: string, message: string | string[], extra?: Record<string, unknown>) => void;
    error: LogFunction;
    warn: LogFunction;
    info: LogFunction;
    debug: LogFunction;
    /**
     * Return/resolve when all log messages are sent
     */
    flush?: () => Promise<void> | void;
}
