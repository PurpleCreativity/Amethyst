import process from "node:process";
import axios, { type Axios } from "axios";
import { type ClientOptions, Client as DiscordClient, TextChannel } from "discord.js";
import dotenv from "dotenv";
import noblox from "noblox.js";
import config from "../config.js";
import type { configType } from "../types/config.d.js";
dotenv.config();

import API from "../core/API.js";
import Database from "../core/Database.js";
import Events from "../core/Events.js";
import Functions from "../core/Functions.js";
import Interactables from "../core/Interactables.js";
import Logs from "../core/Logs.js";
import Plugins from "../core/Plugins.js";
import Process from "../core/Process.js";
import Threader from "../core/Threader.js";

export default class Client extends DiscordClient {
    readonly startTime: Date = new Date();

    readonly config: configType = config;

    readonly args: string[] = process.argv.slice(2);
    readonly devMode: boolean = this.args.includes("--dev");
    readonly redeployCommands: boolean = this.args.includes("--redeployCommands") || this.args.includes("--rc");

    readonly botChannels: { [key: string]: TextChannel } = {};

    static loadingOrder: Array<keyof Client> = [
        "Functions",
        "Threader",
        "Events",
        "Process",
        "Logs",

        "Database",
        "API",
        "Interactables",

        "Plugins",
    ];

    //? Core Modules
    Functions: Functions;
    Threader: Threader;
    Events: Events;
    Process: Process;
    Logs: Logs;
    Database: Database;
    API: API;
    Interactables: Interactables;
    Plugins: Plugins;

    //? Dependencies
    Axios: Axios = axios.create();
    noblox: typeof noblox = noblox;

    constructor(options: ClientOptions) {
        super(options);

        this.Functions = new Functions(this);
        this.Threader = new Threader(this);
        this.Events = new Events(this);
        this.Process = new Process(this);
        this.Logs = new Logs(this);
        this.Database = new Database(this);
        this.API = new API(this);
        this.Interactables = new Interactables(this);
        this.Plugins = new Plugins(this);
    }

    private Log = (
        type: "error" | "success" | "info" | "verbose" | "warn" | "deprecated",
        message: unknown,
        useDate?: boolean,
    ): void => {
        try {
            const stack = new Error().stack as string;
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
                fullMessage = `[${new Date().toISOString().replace("T", " ").replace("Z", "")}] ${fullMessage}`;
            }
            if (this.config.logConfig[type] === undefined) {
                this.Log("error", `Invalid log type ${type}`);
                return;
            }
            console.log(this.config.logConfig[type].color(fullMessage));
        } catch (error: unknown) {
            console.error(error);
        }
    };

    log = (message: unknown, useDate?: boolean): void => {
        this.Log("info", message, useDate);
    };

    warn = (message: unknown, useDate?: boolean): void => {
        this.Log("warn", message, useDate);
    };

    error = (message: unknown, useDate?: boolean): void => {
        this.Log("error", message, useDate);
    };

    success = (message: unknown, useDate?: boolean): void => {
        this.Log("success", message, useDate);
    };

    verbose = (message: unknown, useDate?: boolean): void => {
        if (!this.devMode) return;
        this.Log("verbose", message, useDate);
    };

    Startup = async (): Promise<void> => {
        this.log(`Starting up Amethyst v${this.config.version}`);

        if (this.devMode) {
            this.warn("Running in development mode");

            this.config.baseURL = `http://localhost:${this.config.port}`;

            this.config.credentials.database.host = "localhost";

            this.config.credentials.discordToken = process.env.Dev_discordToken as string;
            this.config.credentials.discordClientSecret = process.env.Dev_discordClientSecret as string;
            this.config.credentials.discordOAuthRedirectLink =
                "https://discord.com/oauth2/authorize?client_id=1271891545527681096&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3003%2Fapi%2Fv1%2Fauth%2Fdiscord%2Fcallback&scope=identify+guilds";
        } else {
            this.config.credentials.discordToken = process.env.discordToken as string;
            this.config.credentials.discordClientSecret = process.env.discordClientSecret as string;
            this.config.credentials.discordOAuthRedirectLink =
                "https://discord.com/oauth2/authorize?client_id=1271862480641069179&response_type=code&redirect_uri=https%3A%2F%2Famethyst-e1050d4a61a7.herokuapp.com%2Fapi%2Fv1%2Fauth%2Fdiscord%2Fcallback&scope=identify+guilds";
        }

        this.config.credentials.encryptionKey = process.env.encryptionKey as string;
        this.config.credentials.sessionSecret = process.env.sessionSecret as string;
        this.config.credentials.robloxCookie = process.env.robloxCookie as string;
        this.config.credentials.robloxOAuthSecret = process.env.robloxOAuthSecret as string;

        await this.login(this.config.credentials.discordToken);
        this.success(`Logged in to Discord as [${this.user?.username}:${this.user?.id}]`);

        try {
            const authuser = await this.noblox.setCookie(this.config.credentials.robloxCookie);
            this.success(`Logged in to Roblox as [${authuser.name}:${authuser.id}]`);
        } catch (error) {
            this.error("Failed to login to Roblox:");
            this.error(error);
        }

        for (const channel in this.config.channels) {
            const channelId = this.config.channels[channel];
            try {
                const fetchedChannel = await this.channels.fetch(channelId);
                if (!(fetchedChannel instanceof TextChannel)) {
                    return this.warn(`Failed to fetch ${channel} channel, channel is not a TextChannel`);
                }

                this.botChannels[channel] = fetchedChannel;
            } catch (error) {
                this.error(`Failed to fetch ${channel} channel:`);
                this.error(error);

                process.exit(1);
            }
        }

        for (const moduleName of Client.loadingOrder) {
            const moduleObject = this[moduleName];
            if (!(moduleObject instanceof Object)) {
                this.error(`Failed to load ${moduleName as string} module`);
                continue;
            }

            this.success(`Loaded ${moduleName as string} module`);

            try {
                if ("Init" in moduleObject && typeof moduleObject.Init === "function") {
                    // @ts-ignore: Should we really go an extra mile to check if the function is async?
                    await moduleObject.Init();
                    this.success(`Executed Init for ${moduleName as string} module`);
                }
            } catch (error) {
                this.error(`Failed to load ${moduleName as string} module:`);
                if (error instanceof Error) this.error(error.stack);

                process.exit(1);
            }
        }

        const originalLog = this.Log;
        this.Log = (
            type: "error" | "success" | "info" | "verbose" | "warn" | "deprecated",
            message: unknown,
            useDate?: boolean,
        ): void => {
            originalLog(type, message, useDate);
            this.Logs.writeLogFile(type, message);
        };

        for (const moduleName of Client.loadingOrder) {
            const moduleObject = this[moduleName];
            if (!(moduleObject instanceof Object)) {
                continue;
            }

            try {
                if ("afterInit" in moduleObject && typeof moduleObject.afterInit === "function") {
                    // @ts-ignore: Should we really go an extra mile to check if the function is async?
                    await moduleObject.afterInit();
                    this.success(`Executed afterInit for ${moduleName as string} module`);
                }
            } catch (error) {
                this.error(`Failed to execute afterInit for ${moduleName as string} module:`);
                if (error instanceof Error) this.error(error.stack);

                process.exit(1);
            }
        }

        this.success(`Amethyst online, startup took ${new Date().getTime() - this.startTime.getTime()}ms`);
    };
}
