type Config = {
    version: string;

    baseURL: string;
    port: number;

    devList: string[];

    credentials: {
        discordToken: string;
        discordClientSecret: string;

        databaseURL: string;

        robloxCookie: string;
        
        robloxOAuthSecret: string;
        robloxOauthClientId: string;
    
        encryptionKey: string;
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