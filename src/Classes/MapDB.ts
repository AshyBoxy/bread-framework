import IDatabase from "../Interfaces/Database";

export default class MapDB<valueType> implements IDatabase<valueType> {
    #map = new Map<string, valueType>();
    get(key: string): valueType | undefined {
        return this.#map.get(key);
    }
    put(key: string, value: valueType): void {
        this.#map.set(key, value);
    }
    set = this.put;
    close = (): Promise<void> => new Promise((r) => r());
}
