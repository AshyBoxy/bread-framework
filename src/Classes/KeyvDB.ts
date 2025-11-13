import Keyv, { KeyvOptions, KeyvStoreAdapter } from "keyv";
import IDatabase from "../Interfaces/Database";
import ILogger from "../Interfaces/Logger";

class KeyvDB<valueType> implements IDatabase<valueType> {
    db: Keyv;

    constructor(store: KeyvStoreAdapter, options: KeyvOptions, private logger?: ILogger) {
        this.db = new Keyv(store, options);
        this.db.on("error", (err) => {
            // eslint-disable-next-line no-console
            (this.logger?.error || console.error)(err);
        });
        this.db.on("PRE_SET", (...args) => {
            // eslint-disable-next-line no-console
            (this.logger?.debug || console.debug)(args);
        });
    }

    get(key: string): Promise<valueType | undefined> {
        return this.db.get(key);
    }

    async put(key: string, value: valueType): Promise<void> {
        const result = await this.db.set(key, value);
        if (!result) this.logger?.warn("failed setting in keyvdb");
        else this.logger?.debug(`set ${key} in keyvdb`);
    }
    set = this.put;

    close = (): Promise<void> => this.db.disconnect();

    setLogger(logger: ILogger): void {
        this.logger = logger;
    }
}

export default KeyvDB;
