import winston, { transports, LoggerOptions } from "winston";
const { createLogger, format, transports: transport } = winston;
// import Transport from "winston-transport";
// import IWinstonTransportInfo from "../Interfaces/WinstonTransportInfo";
// import { WebhookClient } from "discord.js";
// import config from "../config";

// webhook disabled until config is figured out

// const webhook = new WebhookClient({ id: config.winston.webhook.id, token: config.winston.webhook.token }, {
//     allowedMentions: {
//         parse: []
//     }
// });

const consoleSettings: transports.ConsoleTransportOptions = {
    level: "silly",
    format: format.combine(
        format.colorize(),
        format.timestamp({
            format: "ddd MMM DD YY HH:mm:ss ZZ"
        }),
        format.printf(({ level, message, timestamp, ...rest }) => `${timestamp} - ${level}: ${message} (${JSON.stringify(rest)})`)
    )
};

// const webhookSettings: Transport.TransportStreamOptions = {
//     level: "silly",
//     format: format.combine(
//         format.timestamp({
//             format: "ddd MMM DD YY HH:mm:ss ZZ"
//         })
//     )
// };

// class DiscordWebhook extends Transport {
//     constructor(opts?: Transport.TransportStreamOptions) {
//         super(opts);
//     }

//     async log(info: IWinstonTransportInfo, callback: () => void): Promise<void> {
//         setImmediate(() => {
//             this.emit("logged", info);
//         });

//         const { level, message, timestamp, ...rest } = info;

//         // eslint-disable-next-line no-console
//         await webhook.send(`>>> ${timestamp} - ${level}: ${message} (${JSON.stringify(rest)})`).catch(console.error);

//         callback();
//     }
// }

const settings: LoggerOptions = {
    transports: [new transport.Console(consoleSettings)//,
        // new DiscordWebhook(webhookSettings)
        // eslint-disable-next-line array-bracket-newline
    ]
};

const logger = createLogger(settings);

export default logger;
