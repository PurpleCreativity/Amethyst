type Config = {
    version: string;

    baseURL: string;
    port: number;

    devList: string[];

    credentials: {
        discordToken: string;
        robloxCookie: string;
        databaseURL: string;
    
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