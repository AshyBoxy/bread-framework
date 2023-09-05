export default interface IDatabase<valueType> {
    get(key: string): Promise<valueType | undefined> | valueType | undefined;
    put(key: string, value: valueType): Promise<void> | void;
    set(key: string, value: valueType): Promise<void> | void;
    close(): Promise<void>;
}
