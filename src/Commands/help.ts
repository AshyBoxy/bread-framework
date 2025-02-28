import Command from "../Classes/Command";
import BreadEmbed from "../Classes/BreadEmbed";
import IGuildConfig from "../Interfaces/GuildConfig";
import { strings } from "..";

export default new Command(async function (bot, msg, args) {
    const input = args.join(" ").toLowerCase();
    // const command = bot.commands.get(input) || bot.commands.get(<string>bot.aliases.get(input));
    const command = bot.commandByName(input);
    const module = bot.modules.find((x) => strings.get(x.name).toLowerCase() === input);
    const embed = new BreadEmbed()
        .setColor(msg.guild?.members.me?.displayColor || 0xff00ff); // todo: make this not hardcoded

    let config: IGuildConfig | undefined;
    if (msg.guild) config = await bot.dbs.guildConfigs.get(msg.guild.id);
    if (!config) config = {};

    const prefix = config.prefix || bot.config.prefix;

    if (module) {
        for (const cmd of bot.commands.values()) if (cmd.module === module) embed.addField(cmd.getName(), cmd.getInfo(), true);
        embed.setTitle(`${strings.get(module.name)} Help`)
            .setFooter(`Use '${prefix}${this.getName().toLowerCase()} <command>' for more info on a command`);
    } else if (command) {
        embed.setTitle(`${msg.guild?.members.me?.displayName || bot.user?.username} Help`)
            .setDescription(command.getName())
            .addField("Info", command.getInfo(), true)
            .addField("Usage", `${prefix}${command.getUsage()}`, true);

        if (command.aliases[0]) embed.addField("Aliases", command.aliases.join(", "), true);
    } else if (!args[0]) {
        embed.setTitle(`${msg.guild?.members.me?.displayName || bot.user?.username} Help`)
            .setDescription("Modules")
            .setFooter(`Use '${prefix}${this.getName().toLowerCase()} <module>' for more info on a module`);

        for (const modulei of bot.modules) embed.addField(strings.get(modulei.name), strings.get(modulei.description), true);
    } else embed.setTitle(`Command or Module "${args[0]}" could not be found!`);

    // msg.channel.send({ embeds: [embed] });
    msg.reply({ embeds: [embed] });
}, {
    ns: "bread_framework",
    id: "help",
    aliases: ["h"]
});
