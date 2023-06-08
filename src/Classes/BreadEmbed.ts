import { EmbedBuilder, EmbedFooterOptions } from "@discordjs/builders";

class BreadEmbed extends EmbedBuilder {
    constructor(...args: never[]) {
        super(...args);
    }

    addField(name = "", value = "", inline = false): this {
        this.addFields({
            name, value, inline
        });
        return this;
    }

    setFooter(footer: string | EmbedFooterOptions | null): this {
        if (typeof footer === "object") super.setFooter(footer);
        else super.setFooter({
            text: footer || ""
        });
        return this;
    }
}

export default BreadEmbed;
