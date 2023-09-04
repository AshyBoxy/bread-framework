import { COMMANDS } from "../../../constants";
import Command from "../Classes/Command";
import BreadEmbed from "../Classes/BreadEmbed";
import IGuildConfig from "../Interfaces/GuildConfig";

const helpCmd = new Command(async (bot, msg, args) => {
    const input = args.join(" ").toLowerCase();
    const command = bot.commands.get(input) || bot.commands.get(<string>bot.aliases.get(input));
    const module = bot.modules.find((x) => x.name.toLowerCase() === input);
    const embed = new BreadEmbed()
        .setColor(msg.guild?.members.me?.displayColor || COMMANDS.SPECIAL.HELP.embedColor);

    let config: IGuildConfig | undefined;
    if (msg.guild) config = await bot.guildConfigs.get(msg.guild.id);
    if (!config) config = {};

    const prefix = config.prefix || bot.config.prefix;

    if (module) {
        for (const cmd of bot.commands.values()) if (cmd.module === module) embed.addField(cmd.name, cmd.info, true);
        embed.setTitle(`${module.name} Help`)
            .setFooter(`Use '${prefix}${helpCmd.name} <command>' for more info on a command`);
    } else if (command) {
        embed.setTitle(`${msg.guild?.members.me?.displayName || bot.user?.username} Help`)
            .setDescription(command.name)
            .addField("Info", command.info, true)
            .addField("Usage", `${prefix}${command.usage}`, true);

        if (command.aliases[0]) embed.addField("Aliases", command.aliases.join(", "), true);
    } else if (!args[0]) {
        embed.setTitle(`${msg.guild?.members.me?.displayName || bot.user?.username} Help`)
            .setDescription("Modules")
            .setFooter(`Use '${prefix}help <module>' for more info on a module`);

        for (const modulei of bot.modules) embed.addField(modulei.name, modulei.description, true);
    } else embed.setTitle(`Command or Module "${args[0]}" could not be found!`);

    msg.channel.send({ embeds: [embed] });
}, {
    name: "Help",
    info: "Shows help",
    usage: "help [module|command]",
    aliases: ["h"]
});

export default helpCmd;
