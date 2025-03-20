import Command from "../Classes/Command";

export default new Command((bot, ctx) => {
    ctx.send(`Pong! ${Math.floor(bot.ws.ping)}ms`);
    return 0;
}, {
    name: "Ping",
    info: "Displays websocket ping",
    usage: "ping",
    aliases: [
        "p",
        "pong"
    ],

    disabled: false,
    guildOnly: false,
    dmOnly: false,
    permission: [],
    botPermission: [],

    interactionOnly: false,
    messageOnly: false,

    args: []
});
