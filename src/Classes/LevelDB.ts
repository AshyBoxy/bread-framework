import levelup, { LevelUp } from "levelup";
import leveldown from "leveldown";

class LevelDB<valueType>{
    db: LevelUp;

    constructor(path: string) {
        this.db = levelup(leveldown(path));
    }

    async get(key: string): Promise<valueType | undefined> {
        let data = (await this.db.get(key).catch(() => undefined))?.toString();
        try {
            const newData = JSON.parse(data);
            data = newData;
        } catch { /**/ }
        return data;
    }

    async put(key: string, value: valueType): Promise<void> {
        let data: valueType | string = value;
        if (typeof data !== "string") data = JSON.stringify(data);
        await this.db.put(key, data);
    }
    set = this.put;
}

export default LevelDB;
