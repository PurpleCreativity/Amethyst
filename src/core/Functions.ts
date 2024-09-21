import { type ActivityOptions, type Guild, type GuildScheduledEventCreateOptions, Message, type Snowflake, type StartThreadOptions, type TextChannel, type User } from "discord.js";
import type SuperClient from "../classes/SuperClient.js";
import { createCipheriv, createDecipheriv } from "node:crypto";
import BaseEmbed, { type EmbedOptions } from "../classes/BaseEmbed.js";
import Icons from "../assets/Icons.js";
import type { PointLog, ScheduledEvent, ScheduleEventType } from "../schemas/guildProfile.js";
import Emojis from "../assets/Emojis.js";

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

    GetRobloxUser = async (searcher: string | number, useCache = true) => {
		if (typeof searcher === "number") {
			try {
				return await this.client.WrapBlox.fetchUser(searcher, useCache);
			} catch (error) {
				return undefined;
			}
		}

		if (typeof searcher === "string") {
			if (!Number.isNaN(Number.parseInt(searcher))) {
				try {
					return await this.client.WrapBlox.fetchUser(Number.parseInt(searcher), useCache);
				} catch (error) {
					return undefined;
				}
			}

			try {
				return await this.client.WrapBlox.fetchUserByName(searcher, useCache);
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

	ConvertStringToHexColor = (string : string) => {
		const isRGBString = /^\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$/.test(string);
		if (isRGBString) {
			return this.StringRGBToColorHex(string);
		}

		return string;
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

    SetActivity = (options: ActivityOptions) => {
		if (!this.client.user) return;

		this.client.user.setActivity(options);
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

	makePointlogEmbed = (pointlog: PointLog) => {
		const embed = this.makeInfoEmbed({
			title: `\`${pointlog.id}\``,
			footer: { text: pointlog.id },
			fields: [ { name: "Notes", value: `${pointlog.notes || "\`No notes\`"}`, inline: false } ]
		})

		const baseDescription = `Created by [${pointlog.creator.username}](https://www.roblox.com/users/${pointlog.creator.id}/profile) on <t:${Math.round(new Date(pointlog.createdAt).getTime() / 1000)}:F>`;

		for (const data of pointlog.data) {
			const foundField = embed.GetField(`> ${data.points} points`)
			if (foundField) {
				foundField.value += `, \`${data.username}\``;
				if (foundField.value.length > 1024) foundField.value = `${foundField.value.substring(0, 1021)}...`;
                continue;
			}

			embed.addFields({ name: `> ${data.points} points`, value: `\`${data.username}\`` })

			if (embed.data.fields?.length && embed.data.fields?.length >= 25) {
				embed.setDescription(`## ${Emojis.warning} Unable to show full log!\n${baseDescription}`);
				break;
			}

			embed.setDescription(baseDescription);
		}

		return embed;
	}

	makeScheduleEventEmbed = (eventData: ScheduledEvent, eventType: ScheduleEventType) => {
		return this.makeInfoEmbed({
			title: `\`${eventData.id}\``,
			footer: { text: eventData.id },
			color: eventType.color || 0xffffff,
			fields: [
				{ name: "Type", value: `\`${eventType.name}\``, inline: true },
				{ name: "Time", value: `<t:${Math.round(new Date(eventData.time).getTime() / 1000)}:F>`, inline: true },
				{ name: "Duration", value: `${eventData.duration} minutes`, inline: true },
				{ name: "Host", value: `[${eventData.host.username}](https://www.roblox.com/users/${eventData.host.id}/profile)`, inline: true },
				{ name: "Notes", value: `${eventData.notes || "\`No notes\`"}`, inline: false }
			]
		})
	}

	startThread = async (starter: Message | TextChannel, options: StartThreadOptions) => {
		if (starter instanceof Message) {
			return await starter.startThread(options);
		}
		
		return await starter.threads.create(options);
	}

	scheduleGuildEvent = async (guild: Guild | string | Snowflake, event: GuildScheduledEventCreateOptions) => {
		let actualGuild: Guild | undefined;
        if (typeof guild === "string") actualGuild = await this.client.Functions.GetGuild(guild, false) as Guild; else actualGuild = guild;
        if (!actualGuild) throw new Error("Guild not found");

		return await actualGuild.scheduledEvents.create(event);
	}

    pcall = async <Params extends any[], Ret>(func: (...args: Params) => Ret, ...args: Params) => {
		try {
			return [true, await func(...args)]
		} catch (err) {
			return [false, err as Error];
		}
	};
}