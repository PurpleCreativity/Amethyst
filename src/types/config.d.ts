import type { ChalkInstance } from "chalk";

type configType = {
    version: string;

    baseURL: string;
    port: number;

    devList: string[];

    credentials: {
        discordToken: string;
        discordClientSecret: string;
        discordOAuthRedirectLink: string;

        databaseURI: string;

        robloxCookie: string;

        robloxOAuthSecret: string;
        robloxOauthClientId: string;

        encryptionKey: string;
        sessionSecret: string;
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

export type { configType };