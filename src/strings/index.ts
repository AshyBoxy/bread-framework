// import uwuify from "../../../Utils/uwuify";

const defaultStringsPath = "./english.json";
// const defaultStringsPath = "./french.json";
const defaultStrings: TranslationData = {
    name: "breadfw_defaultstrings",
    data: (await import(defaultStringsPath, { with: { type: "json" } })).default
};


interface TranslationData {
    name: string; // the name is used as an id for removing sources, also could be useful in debugging?
    data: Record<string, string>;
}


class Strings {
    static format = (str: string, ...args: unknown[]): string => str.replace(/{(\d+)(\..*?)?}/g, (m, num, tar) =>
        tar?.split(".").slice(1).reduce((acc: Record<string, unknown> | undefined, cur: string) => acc && acc[cur], args[num]) || args[num] || m);
    static instance = new Strings();
    static addSource = Strings.instance.addSource;
    static addDefaultSource = Strings.instance.addDefaultSource;
    static removeSource = Strings.instance.removeSource;
    static clearSources = Strings.instance.clearSources;
    static updateSources = Strings.instance.updateSources;
    static getString = Strings.instance.getString;
    static get = Strings.getString;


    private flatSources: Record<string, string> = {};
    private defaultSources: TranslationData[];


    constructor(public sources: TranslationData[] = [defaultStrings]) {
        this.get = this.getString;
        this.defaultSources = [...sources];
        this.updateSources();
    }


    // new sources should take precedence over old ones by default (start = true)
    addSource = (source: TranslationData, start = true): this => {
        if (start) this.sources.unshift(source);
        else this.sources.push(source);
        this.updateSources();
        return this;
    };

    addDefaultSource = (source: TranslationData, start = true): this => {
        if (start) this.defaultSources.unshift(source);
        else this.defaultSources.push(source);
        this.updateSources();
        return this;
    };

    removeSource = (source: TranslationData): this => {
        this.sources = this.sources.filter((x) => x.name === source.name);
        this.updateSources();
        return this;
    };

    clearSources = (): this => {
        this.sources = [...this.defaultSources];
        this.updateSources();
        return this;
    };

    updateSources = (): this => {
        this.flatSources = Object.assign({}, ...this.sources.toReversed().map((x) => x.data));
        return this;
    };

    getString = (str: string, ...args: unknown[]): string => {
        const a = this.flatSources[str] && Strings.format(this.flatSources[str], ...args) || str;
        // return uwuify(a);
        return a;
    };
    get: typeof getString;
}

const format = Strings.format;
const getString = Strings.getString;

export { format, getString, Strings, TranslationData };
export default Strings;
