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

    constructor(public source: Record<string, string> = strings) {
        this.get = this.getString;
    }


    getString = (str: string, ...args: unknown[]): string => this.source[str] && Strings.format(strings[str], ...args) || str;
    get: typeof getString;

    static getString = Strings.instance.getString;
    static get = Strings.getString;
}

const format = Strings.format;
const getString = Strings.getString;

export { format, getString, Strings };
export default Strings;
