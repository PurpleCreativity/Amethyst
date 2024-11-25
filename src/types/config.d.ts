import type { ChalkInstance } from "chalk";

export type DatabaseConfig = {
    host: string,
    port: number,
    user: string,
    password: string,
    database: string;
    connectionLimit: number,
}

export type configType = {
    version: string;

    baseURL: string;
    port: number;

    devList: string[];

    credentials: {
        discordToken: string;
        discordClientSecret: string;
        discordOAuthRedirectLink: string;

        database: DatabaseConfig;

        robloxCookie: string;

        robloxOAuthSecret: string;
        robloxOauthClientId: string;

        encryptionKey: string;
        sessionSecret: string;
    };

    logs: {
        max_file_size: number; // in MB
    };

    channels: {
        [key: string]: string;
    };

    logConfig: {
        [key: string]: {
            color: ChalkInstance;
            name: string;
        };
    };
};
