// import uwuify from "../../../Utils/uwuify";

const strings: Record<string, string> = (await import("./default.json", { assert: { type: "json" } })).default;

// const format = (str: string, ...args: unknown[]): string => str.replace(/{(\d+)(\..*?)?}/g, (m, num, tar) =>
//     tar?.split(".").slice(1).reduce((acc: Record<string, unknown> | undefined, cur: string) => acc && acc[cur], args[num]) || args[num] || m);

// const getString = (str, ...args) => {
//     if (!strings[str]) return str;
//     return format(strings[str], ...args);
// };

// const getString = (str: string, ...args: unknown[]): string => strings[str] && format(strings[str], ...args) || str;


class Strings {
    static instance = new Strings();
    static format = (str: string, ...args: unknown[]): string => str.replace(/{(\d+)(\..*?)?}/g, (m, num, tar) =>
        tar?.split(".").slice(1).reduce((acc: Record<string, unknown> | undefined, cur: string) => acc && acc[cur], args[num]) || args[num] || m);

    constructor(public sources: Record<string, string>[] = [strings]) {
        this.get = this.getString;
    }

    addSource = (source: Record<string, string>): this => {
        this.sources.unshift(source);
        return this;
    };

    clearSources = (): this => {
        this.sources = [strings];
        return this;
    };

    static addSource = Strings.instance.addSource;
    static clearSources = Strings.instance.clearSources;

    getString = (str: string, ...args: unknown[]): string => {
        const source = this.sources.find((x) => x[str]);
        // return;
        const a = source?.[str] && Strings.format(source[str], ...args) || str;
        // return uwuify(a);
        return a;
    };
    get: typeof getString;

    static getString = Strings.instance.getString;
    static get = Strings.getString;
}

const format = Strings.format;
const getString = Strings.getString;

export { format, getString, Strings };
export default Strings;
