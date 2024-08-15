import type { ActivityType, Guild, User } from "discord.js";
import type SuperClient from "../classes/SuperClient.js";
import { createCipheriv, createDecipheriv } from "node:crypto";
import BaseEmbed, { type EmbedOptions } from "../classes/BaseEmbed.js";
import Icons from "../assets/Icons.js";

export default class Functions {
    client: SuperClient;

    constructor(client: SuperClient) {
        this.client = client;
    }

    Init = async () => {
        this.client.success("Initialized Functions");
    }

    GetGuild = async (guildID: string, useCache = true) => {
		let guild: Guild | undefined
		if (useCache) {
			guild = this.client.guilds.cache.get(guildID);
			if (guild) return guild;
		}
		try {
			guild = await this.client.guilds.fetch(guildID);
		} catch (err) {
			return undefined;
		}
		return guild;
	};

    GetUser = async (searcher: string, guild?: Guild, self?: User) => {
		if (searcher.toLowerCase() === "self" || searcher.toLowerCase() === "me" && self) return self;
		// See if it matches <@id>;
		if (searcher.startsWith("<@") && searcher.endsWith(">")) searcher = searcher.slice(2, -1);

		try {
			const user = await this.client.users.fetch(searcher);
			return user;
		} catch (err) {
			if (guild) {
				const found = await guild.members.fetch({ query: searcher, limit: 1 })
				if (found.size > 0) return found.first()?.user;
			}

			for (const user of this.client.users.cache.values()) {


				if (user.username.toLowerCase() === searcher.toLowerCase()) {
					return user;
				}

				if (user.displayName.toLowerCase() === searcher.toLowerCase()) {
					return user;
				}
			}
		}
	};

    GetChannel = async (searcher: string, guild?: Guild, limitToGuild = false) => {
		// See if it matches <#id>;
		if (searcher.startsWith("<#") && searcher.endsWith(">")) searcher = searcher.slice(2, -1);
		if (searcher.startsWith("#")) searcher = searcher.slice(1);
		// Replace all spaces with dashes
		searcher = searcher.replace(/ /g, "-");

		try {
			const channel = await this.client.channels.fetch(searcher);
			if (!channel) throw new Error("Channel not found");

			if (!limitToGuild || !guild) return channel;


			if (!("guild" in channel)) throw new Error("Channel not found");
			if (channel.guild.id === guild.id) return channel;

			throw new Error("Channel not found");
		} catch (err) {
			if (guild) {
				for (const channel of guild.channels.cache.values()) {
					if (channel.name.toLowerCase() === searcher.toLowerCase()) {
						return channel;
					}
				}
			}

			for (const channel of this.client.channels.cache.values()) {
				if (!("name" in channel)) continue;
				if (!channel.name) continue
				if (channel.name.toLowerCase() === searcher.toLowerCase()) {
					if (!limitToGuild || !guild) return channel;
					if (!("guild" in channel)) continue;
					if (channel.guild.id === guild.id) return channel;
				}
			}
		}

		return undefined;
	};

    GetRole = async (searcher: string, guild: Guild) => {
		// See if it matches <@&id>;
		if (searcher.startsWith("<@&") && searcher.endsWith(">")) searcher = searcher.slice(3, -1);

		try {
			const role = await guild.roles.fetch(searcher);
			if (role) return role;
			throw new Error("Role not found");
		} catch (err) {
			for (const role of guild.roles.cache.values()) {
				if (role.name.toLowerCase() === searcher.toLowerCase()) {
					return role;
				}
				if (role.id === searcher) {
					return role;
				}
				if (role.name.toLowerCase().startsWith(searcher.toLowerCase())) {
					return role;
				}
			}
		}
	};

    GetRobloxUser = async (searcher: string | number) => {
		if (typeof searcher === "number") {
			try {
				return await this.client.WrapBlox.fetchUser(searcher);
			} catch (error) {
				return undefined;
			}
		}

		if (typeof searcher === "string") {
			if (!Number.isNaN(Number.parseInt(searcher))) {
				try {
					return await this.client.WrapBlox.fetchUser(Number.parseInt(searcher));
				} catch (error) {
					return undefined;
				}
			}

			try {
				return await this.client.WrapBlox.fetchUserByName(searcher);
			} catch (error) {
				return undefined;
			}
		}
	}

	GetLinkedRobloxUser = async (discordId: string) => {
		const userDataProfile = await this.client.Database.GetUserProfile(discordId);
		if (!userDataProfile || !userDataProfile.roblox.id || userDataProfile.roblox.id === 0) return undefined;

		return await this.GetRobloxUser(userDataProfile.roblox.id);
	}

    GenerateID = () => {
		return crypto.randomUUID();
	};

	MemoryUsage = () => {
		const used = process.memoryUsage().heapUsed / 1024 / 1024;
		return Math.round(used)
	};

	CreateAcronym = (string : string) => {
		return string.split(" ").map(word => word[0].toUpperCase()).join("");
	}

    ConvertPlaceIDToUniverseID = async (placeID: number) => {
		const response = await this.client.Axios.get(`https://apis.roblox.com/universes/v1/places/${placeID}/universe`);
		return response.data.universeId;
	};

    TrueStrings = ["true", "yes", "1", "on"];
	FalseStrings = ["false", "no", "0", "off"];
	StringToBoolean = (string: string) => {
		if (this.TrueStrings.includes(string.toLowerCase())) return true;
		if (this.FalseStrings.includes(string.toLowerCase())) return false;
		return false;
	}

    StringRGBToColorHex = (string : string) => {
		const rgb = string.split(",");
		if (rgb.length !== 3) {
			throw new Error("Invalid RGB input. RGB input should have exactly 3 values between 0 and 255 separated by commas.");
		}
		const hex = rgb.map((value) => {
			const intValue = Number.parseInt(value.trim(), 10);
			if (Number.isNaN(intValue) || intValue < 0 || intValue > 255) {
				throw new Error("Invalid RGB input. Each value should be an integer between 0 and 255.");
			}
			const hexValue = intValue.toString(16).padStart(2, "0");
			return hexValue;
		});
		const hexColor = `#${hex.join("")}`;
		return hexColor;
	}

    Encypt = (text : string, iv : any) => {
		const key = Buffer.from(this.client.config.credentials.encryptionKey, 'hex');
		iv = Buffer.from(iv, 'hex');

		const cipher = createCipheriv('aes256', key, iv);
		const encryptedMessage = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');

		return encryptedMessage;
	}

	Decrypt = (text : string, iv : any) => {
		const key = Buffer.from(this.client.config.credentials.encryptionKey, 'hex');
		iv = Buffer.from(iv, 'hex');

		const decipher = createDecipheriv('aes256', key, iv);
		const decryptedMessage = decipher.update(text, 'hex', 'utf-8') + decipher.final('utf8');

		return decryptedMessage;
	}

    SetActivity = (text: string, activityType: ActivityType) => {
		if (!this.client.user) return;

		this.client.user.setActivity(text, { type: activityType });
	}

	isDev = (userID: string) => {
		return this.client.config.devList.includes(userID);
	}

	makeInfoEmbed = (options: EmbedOptions) => {
		const embed = new BaseEmbed(options);
		if (!options.color) embed.setColor(0x4287f5);
		if (!options.author) embed.setAuthor({ name: "Info", iconURL: Icons.info });

		return embed;
	}

	makeWarnEmbed = (options: EmbedOptions) => {
		const embed = new BaseEmbed(options);
		if (!options.color) embed.setColor(0xffcc00);
		if (!options.author) embed.setAuthor({ name: "Warning", iconURL: Icons.warn });

		return embed;
	}

	makeSuccessEmbed = (options: EmbedOptions) => {
		const embed = new BaseEmbed(options);
		if (!options.color) embed.setColor(0x00ff00);
		if (!options.author) embed.setAuthor({ name: "Success", iconURL: Icons.check });

		return embed;
	}

	makeErrorEmbed = (options: EmbedOptions) => {
		const embed = new BaseEmbed(options);
		if (!options.color) embed.setColor(0xff0000);
		if (!options.author) embed.setAuthor({ name: "Error", iconURL: Icons.close });

		return embed;
	}

    pcall = async <Params extends any[], Ret>(func: (...args: Params) => Ret, ...args: Params) => {
		try {
			return [true, await func(...args)]
		} catch (err) {
			return [false, err as Error];
		}
	};
}