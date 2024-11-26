import { Buffer } from "node:buffer";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import process from "node:process";
import { Colors, GuildMember, type User, type Guild } from "discord.js";
import Icons from "../../public/Icons.json" with { type: "json" };
import type Client from "../classes/Client.ts";
import Embed, { type EmbedOptions } from "../classes/Embed.js";

export default class Functions {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    fetchGuild = async (guildId: string, useCache = true) => {
		let guild: Guild | undefined
		if (useCache) {
			guild = this.client.guilds.cache.get(guildId);
			if (guild) return guild;
		}
		try {
			guild = await this.client.guilds.fetch(guildId);
		} catch (err) {
			return undefined;
		}
		return guild;
	};

    fetchUser = async (searcher: string, guild?: Guild, self?: User) => {
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

    fetchGuildMember = async (searcher: string, guild: Guild, self?: User | GuildMember) => {
        try {
            if (searcher.toLowerCase() === "self" || searcher.toLowerCase() === "me" && self) {
                if (self instanceof GuildMember) return self;
    
                return await guild.members.fetch(searcher);
            }

            return await guild.members.fetch(searcher);
        } catch (error) {
            return undefined;
        }
    }

    fetchChannel = async (searcher: string, guild?: Guild, limitToGuild = false) => {
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

    fetchRole = async (searcher: string, guild: Guild) => {
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

    wait = async (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
    };

    findKeyfromValue = (map: Map<unknown, unknown>, value: unknown) => {
        return [...map].find(([key, val]) => val === value)?.[0];
    };

    GenerateID = () => {
        return crypto.randomUUID();
    };

    GenerateIV = () => {
        return randomBytes(16).toString("hex");
    };

    MemoryUsage = () => {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        return Math.round(used);
    };

    createAcronym = (string: string) => {
        // Removes all non-uppercase letters
        return string.replace(/[^A-Z]/g, "");
    };

    TrueStrings = ["true", "yes", "1", "on"];
    FalseStrings = ["false", "no", "0", "off"];
    StringToBoolean = (string: string) => {
        if (this.TrueStrings.includes(string.toLowerCase())) return true;
        if (this.FalseStrings.includes(string.toLowerCase())) return false;
        return false;
    };

    StringRGBToColorHex = (string: string) => {
        const rgb = string.split(",");
        if (rgb.length !== 3) {
            throw new Error(
                "Invalid RGB input. RGB input should have exactly 3 values between 0 and 255 separated by commas.",
            );
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
    };

    getColor = (string: string) => {
        if (string.startsWith("#") || string.startsWith("0x")) return string;

        const isRGB = /^\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$/.test(string);
        if (isRGB) {
            return this.StringRGBToColorHex(string);
        }

        for (const color of Object.keys(Colors)) {
            if (color.toLowerCase() === string.toLowerCase()) {
                const colorValue = (Colors as Record<string, number>)[color];
                return `#${colorValue.toString(16).padStart(6, "0")}`;
            }
        }

        return undefined;
    };

    Encypt = (text: string, iv: string) => {
        const key = Buffer.from(this.client.config.credentials.encryptionKey, "hex");
        const _iv = Buffer.from(iv, "hex");

        const cipher = createCipheriv("aes256", key, _iv);
        const encryptedMessage = cipher.update(text, "utf8", "hex") + cipher.final("hex");

        return encryptedMessage;
    };

    Decrypt = (text: string, iv: string) => {
        const key = Buffer.from(this.client.config.credentials.encryptionKey, "hex");
        const _iv = Buffer.from(iv, "hex");

        const decipher = createDecipheriv("aes256", key, _iv);
        const decryptedMessage = decipher.update(text, "hex", "utf-8") + decipher.final("utf8");

        return decryptedMessage;
    };

    isDev = (userId: string) => {
        return this.client.config.devList.includes(userId);
    };

    makeInfoEmbed = (options: EmbedOptions) => {
        const embed = new Embed(options);

        if (!options.color) embed.setColor(0x4287f5);
        if (!options.author) {
            embed.setAuthor({ name: "Info", iconURL: Icons.info });
        }

        return embed;
    };

    makeWarnEmbed = (options: EmbedOptions) => {
        const embed = new Embed(options);

        if (!options.color) embed.setColor(0xffcc00);
        if (!options.author) {
            embed.setAuthor({ name: "Warning", iconURL: Icons.warn });
        }

        return embed;
    };

    makeSuccessEmbed = (options: EmbedOptions) => {
        const embed = new Embed(options);

        if (!options.color) embed.setColor(0x00ff00);
        if (!options.author) {
            embed.setAuthor({ name: "Success", iconURL: Icons.check });
        }

        return embed;
    };

    makeErrorEmbed = (options: EmbedOptions) => {
        const embed = new Embed(options);

        if (!options.color) embed.setColor(0xff0000);
        if (!options.author) {
            embed.setAuthor({ name: "Error", iconURL: Icons.close });
        }

        return embed;
    };
}
