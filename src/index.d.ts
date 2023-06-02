// this is the lazy method
// maybe one day stop being lazy

// i forgot why this is the lazy method
// and what the not lazy method is

// export everything at some point

// Classes
export { default as BreadClient, default as Client } from "./Classes/Client";

export { default as BreadDB } from "./Classes/BreadDB";

export { default as Command } from "./Classes/Command";
export { default as GuildCommand } from "./Classes/GuildCommand";

export { default as EventHandler } from "./Classes/EventHandler";

// Interfaces
export { default as IConfig } from "./Interfaces/Config";
export { default as IGuildConfig } from "./Interfaces/GuildConfig";
export { default as IModule } from "./Interfaces/Module";
export { default as BreadMessage, default as Message } from "./Interfaces/Message";

// why don't i use this for classes?
export * from "./";
