import { Config } from "./types/Config.js";

import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();

const config = {} as Config;

config.version = "1.0.0"

config.baseURL = "https://ametron-71e64ed61077.herokuapp.com/"
config.port = process.env.PORT ? parseInt(process.env.PORT) : 3003

config.devList = [
	"762329291169857537" // Purple_Creativity
]

config.credentials = {
    discordToken: "",
    robloxCookie: "",
    databaseURL: "",
    encryptionKey: ""
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