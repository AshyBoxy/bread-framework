import { existsSync, readFileSync, statSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import IDatabase from "../Interfaces/Database";

export default class JsonDB<valueType> implements IDatabase<valueType> {
    #path: string;
    #current: Record<string, valueType>;
    #saving: Promise<void> | null = null;

    constructor(path: string) {
        if (existsSync(path)) {
            if (!statSync(path).isFile()) throw new Error();
            this.#current = JSON.parse(readFileSync(path, "utf8"));
        } else this.#current = {};

        this.#path = path;
    }

    get(key: string): valueType | undefined {
        return this.#current[key];
    }

    put(key: string, value: valueType): void {
        this.#current[key] = value;
        this.save();
    }
    set = this.put;

    async close(): Promise<void> {
        await this.save();
    }

    async save(): Promise<void> {
        await this.#saving;
        this.#saving = writeFile(this.#path, JSON.stringify(this.#current, null, 4));
        await this.#saving;
    }
}
