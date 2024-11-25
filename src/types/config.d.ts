import type { ChalkInstance } from "chalk";
import type { PoolConfig } from "mariadb";

export type configType = {
    version: string;

    baseURL: string;
    port: number;

    devList: string[];

    credentials: {
        discordToken: string;
        discordClientSecret: string;
        discordOAuthRedirectLink: string;

        database: PoolConfig;

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
