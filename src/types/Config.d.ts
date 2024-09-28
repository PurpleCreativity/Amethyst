type Config = {
    version: string;

    baseURL: string;
    port: number;

    devList: string[];

    credentials: {
        discordToken: string;
        discordClientSecret: string;
        discordOAuthRedirectLink: string;

        databaseURL: string;

        robloxCookie: string;
        robloxCSRF_Token: string;
        
        robloxOAuthSecret: string;
        robloxOauthClientId: string;
    
        encryptionKey: string;
        sessionSecret: string;
    },

    channels: {
		[key: string]: string
	};
    
    logConfig: {
		[key: string]: {
			color: ChalkInstance
			name: string;
		};
	}
};

export type { Config };