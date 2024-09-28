import { ActivityType, Client, type ClientOptions, type TextChannel } from "discord.js";

import type { Config } from "../types/Config.js";
import config from "../config.js";
import Functions from "../core/Functions.js";

import axios, { type Axios } from "axios";
import mongoose, { type Mongoose } from "mongoose";
import NoBlox from "noblox.js";
import WrapBlox from "wrapblox";
import Threader from "../core/Threader.js";
import Events from "../core/Events.js";
import client from "../index.js";
import Database from "../core/Database.js";
import Process from "../core/Process.js";
import API from "../core/API.js";
import Interactables from "../core/Interactables.js";
import Logs from "../core/Logs.js";

class SuperClient extends Client {
    Start = new Date();

    //? Imports
    config: Config = config;
    Functions: Functions
	Threader: Threader;
	Logs: Logs;
	Events: Events;
	Process: Process;
	Database: Database;
	Interactables: Interactables
	API: API;

    //? Dependencies
    Axios: Axios = axios;
    Mongoose: Mongoose = mongoose;
	WrapBlox: WrapBlox = new WrapBlox();
	NoBlox = NoBlox

    //? Properties
    Arguments: string[] = process.argv.slice(2);

    //? Variables
    devMode: boolean = this.Arguments.includes("--dev");
	redeployCommands: boolean = this.Arguments.includes("--rc");
	maintenanceMode: false;
	MemoryUsage: number[] = [];
	BotChannels: { [key: string]: TextChannel } = {};

    //* Log Functions
	Log = async (type : "error" | "success" | "info" | "verbose" | "warn" | "deprecated", message : unknown, useDate?: boolean): Promise<undefined> => {
		try {
			const stack = new Error().stack as string
			const stackArray = stack.split("\n");
			let stackline = stackArray[2]; // "		at FUNCTION (file:///FULLPATH:LINE:COL)"
			// remove the "		at " at the start
			stackline = stackline.replace("    at ", "");

			const stacklineArray = stackline.split(" ");
			let FunctionName: string | undefined = stacklineArray[0];
			// console.log(stacklineArray)
			let Path = stacklineArray[1] || stacklineArray[0]; // (file:///FULLPATH:LINE:COL)
			if (!Path) {
				Path = stacklineArray[0];
				FunctionName = undefined;
			}

			// Remove everything but the last part
			const PathArray = Path.split("/");
			Path = PathArray[PathArray.length - 1];
			// Remove the last ")"
			Path = Path.replace(")", "");

			let infoline: string;
			if (this.devMode && FunctionName) {
				infoline = `${FunctionName} at ${Path}`;
			} else {
				infoline = Path;
			}


			if (typeof message === "object") {
				message = JSON.stringify(message, null, 2);
			}
			let fullMessage = `[${type.toUpperCase()}] (${infoline}) ${message}`;
			if (useDate === true || useDate === undefined) {
				fullMessage += ` at ${new Date().toLocaleString()}`;
			}
			if (this.config.logConfig[type] === undefined) return this.Log("error", `Invalid log type ${type}`);
			console.log(this.config.logConfig[type].color(fullMessage))
		} catch (error: unknown) {
			console.error(error)
		}
	}

	log = async (message: unknown, useDate?: boolean) => {
		this.Log("info", message, useDate);
	};

	warn = async (message: unknown, useDate?: boolean) => {
		this.Log("warn", message, useDate);
	};

	error = async (message: unknown, useDate?: boolean) => {
		this.Log("error", message, useDate);
	};

	success = async (message: unknown, useDate?: boolean) => {
		this.Log("success", message, useDate);
	};

	verbose = async (message: unknown, useDate?: boolean) => {
		if (!this.devMode) return;
		this.Log("verbose", message, useDate);
	};

    Startup = async () => {
        this.log(`Starting up Amethyst v${this.config.version}`);

        if (this.devMode) {
            this.warn("Running in development mode");

            this.config.baseURL = `http://localhost:${this.config.port}/`;

            this.config.credentials.discordToken = process.env.Dev_discordToken as string;
			this.config.credentials.discordClientSecret = process.env.Dev_discordClientSecret as string;
			this.config.credentials.discordOAuthRedirectLink = "https://discord.com/oauth2/authorize?client_id=1271891545527681096&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3003%2Fapi%2Fv1%2Fauth%2Fdiscord%2Fcallback&scope=identify+guilds";
            this.config.credentials.databaseURL = process.env.Dev_databaseURL as string;
        } else {
            this.config.credentials.discordToken = process.env.discordToken as string;
			this.config.credentials.discordClientSecret = process.env.discordClientSecret as string;
			this.config.credentials.discordOAuthRedirectLink = "https://discord.com/oauth2/authorize?client_id=1271862480641069179&response_type=code&redirect_uri=https%3A%2F%2Famethyst-e1050d4a61a7.herokuapp.com%2Fapi%2Fv1%2Fauth%2Fdiscord%2Fcallback&scope=identify+guilds"
            this.config.credentials.databaseURL = process.env.databaseURL as string;
        }
        this.config.credentials.encryptionKey = process.env.encryptionKey as string;
		this.config.credentials.sessionSecret = process.env.sessionSecret as string;
		this.config.credentials.robloxCookie = process.env.robloxCookie as string;
		this.config.credentials.robloxCSRF_Token = process.env.robloxCSRF_Token as string;
		this.config.credentials.robloxOAuthSecret = process.env.robloxOAuthSecret as string;

		await this.login(this.config.credentials.discordToken);
		this.success(`Logged in to Discord as [${this.user?.username}:${this.user?.id}]`);

		try {
			const authuser = await this.NoBlox.setCookie(this.config.credentials.robloxCookie);
			this.config.credentials.robloxCSRF_Token = await this.NoBlox.getGeneralToken();
			this.success(`Logged in to Roblox as [${authuser.name}:${authuser.id}]`);

			// wrapblox is deprecated in this project now.
			await this.WrapBlox.login(this.config.credentials.robloxCookie)
		} catch (error) {
			client.error("Failed to login to Roblox");
			client.error(error);
		}

		for (const channel in this.config.channels) {
			const channelId = this.config.channels[channel];
			try {
				const fetchedChannel = await this.channels.fetch(channelId);
				this.BotChannels[channel] = fetchedChannel as TextChannel;
			} catch (error) {
				this.error(`Failed to fetch channel ${channel}`);
				this.error(error);
			}
		}

		await this.Functions.Init();
		await this.Threader.Init();
		await this.Events.Init();
		await this.Process.Init();
		await this.Database.Init();
		await this.Interactables.Init();
		await this.API.Init();

		this.Functions.SetActivity({ name: `on v${this.config.version}`, type: ActivityType.Playing });

        this.success(`Started up in ${new Date().getTime() - this.Start.getTime()}ms`);

		this.log("Amethyst is now online");
		this.Logs.LogDiscord(`Amethyst is now online on v${this.config.version}`);
    }

    constructor(options: ClientOptions) {
        super(options);

        this.Functions = new Functions(this);
		this.Threader = new Threader(this);
		this.Logs = new Logs(this);
		this.Events = new Events(this);
		this.Process = new Process(this);
		this.Database = new Database(this);
		this.Interactables = new Interactables(this);
		this.API = new API(this);
	}
}

export default SuperClient;