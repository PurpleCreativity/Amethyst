import type { Config } from "./types/Config.js";

import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();

const config = {} as Config;

config.version = "1.0.3"

config.baseURL = "https://amethyst-e1050d4a61a7.herokuapp.com/"
config.port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3003

config.devList = [
	"762329291169857537" // Purple_Creativity
]

config.credentials = {
    discordToken: "",
	discordClientSecret: "",
	discordOAuthRedirectLink: "",

    databaseURL: "",

	robloxCookie: "",

	robloxOAuthSecret: "",
	robloxOauthClientId: "2793559956691610836",

    encryptionKey: "",
	sessionSecret: "",
}

config.channels = {
	errors: "1276657958100668437",
	logs: "1276658150291804160"
}

config.logConfig = {
	error: {
		color: chalk.bold.red,
		name: "Error"
	},
    warn: {
		color: chalk.hex("#FFA500"),
		name: "Warn"
	},
	success: {
		color: chalk.bold.green,
		name: "Success"
	},
	info: {
		color: chalk.bold.blue,
		name: "Info"
	},
	verbose: {
		color: chalk.bold.gray,
		name: "Verbose"
	},
	deprecated: {
		color: chalk.hex("#70543e"),
		name: "Deprecated"
	}
}

export default config;