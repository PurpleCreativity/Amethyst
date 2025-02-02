import process from "node:process";
import chalk from "chalk";
import dotenv from "dotenv";
import type { configType } from "./types/config.js";
dotenv.config();

const config = {} as configType;

config.version = "1.2.0";
config.baseURL = "";
config.port = process.env.PORT ? Number.parseInt(process.env.PORT) : 8080;

config.devList = [
    "762329291169857537", // @purple_creativity
];

config.credentials = {
    discordToken: "",
    discordClientSecret: "",
    discordOAuthRedirectLink: "",

    database: {
        host: process.env.DatabaseHost as string,
        port: 3306,

        user: process.env.DatabaseUser as string,
        password: process.env.DatabasePassword as string,

        database: "amethyst",
        connectionLimit: 5,

        multipleStatements: true,
        compress: false,
        rowsAsArray: false,
    },

    robloxCookie: "",

    robloxOAuthSecret: "",
    robloxOauthClientId: "2793559956691610836",

    encryptionKey: "",
    sessionSecret: "",
};

config.channels = {
    errors: "1276657958100668437",
    logs: "1276658150291804160",
};

config.logConfig = {
    info: {
        color: chalk.bold.blue,
        name: "Info",
    },
    warn: {
        color: chalk.hex("#FFA500"),
        name: "Warn",
    },
    error: {
        color: chalk.bold.red,
        name: "Error",
    },
    success: {
        color: chalk.bold.green,
        name: "Success",
    },
    verbose: {
        color: chalk.bold.gray,
        name: "Verbose",
    },
    deprecated: {
        color: chalk.hex("#70543e"),
        name: "Deprecated",
    },
};

export default config;
