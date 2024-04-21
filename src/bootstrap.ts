import { register } from "node:module";
register("../loader.js", import.meta.url);
export * from "./index.js";
