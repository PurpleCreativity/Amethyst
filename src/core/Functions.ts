import { Buffer } from "node:buffer";
import { createCipheriv, createDecipheriv } from "node:crypto";
import process from "node:process";
import { AxiosError } from "axios";
import { UserAvatarHeadshotImageFormat, type UserAvatarHeadshotImageSize, type UserData } from "bloxwrap";
import { type Guild, GuildMember, type User } from "discord.js";
import { SqlError } from "mariadb";
import Emojis from "../../public/Emojis.json" with { type: "json" };
import Images from "../../public/Images.json" with { type: "json" };
import type Client from "../classes/Client.ts";
import Embed, { type EmbedOptions } from "../classes/components/Embed.js";
import type PointLog from "../classes/database/PointLog.js";

export default class Functions {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    fetchRobloxUser = async (searcher: string | number, useCache = true): Promise<UserData> => {
        if (typeof searcher === "string" && Number.isNaN(Number.parseInt(searcher))) {
            searcher = (await this.client.BloxWrap.fetchUsersByUsernames(searcher, false, { useCache: false }))[0].id;

            if (Number.isNaN(searcher)) throw new Error(`Username "${searcher}" not found or invalid.`);
        }

        return await this.client.BloxWrap.fetchUserById(searcher as number, { useCache: useCache });
    };

    fetchRobloxUserAvatarHeadshot = async (
        userId: number,
        size: UserAvatarHeadshotImageSize,
        isCircular: boolean,
    ): Promise<string | undefined> => {
        try {
            return (
                await this.client.BloxWrap.fetchUserAvatarHeadshot(
                    userId,
                    size,
                    UserAvatarHeadshotImageFormat.Png,
                    isCircular,
                    { useCache: false },
                )
            )[0].imageUrl;
        } catch (error) {
            return undefined;
        }
    };

    fetchGuild = async (guildId: string, useCache = true) => {
        let guild: Guild | undefined;
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
        if (searcher.toLowerCase() === "self" || (searcher.toLowerCase() === "me" && self)) return self;
        if (searcher.startsWith("<@") && searcher.endsWith(">")) searcher = searcher.slice(2, -1);

        try {
            const user = await this.client.users.fetch(searcher);
            return user;
        } catch (err) {
            if (guild) {
                const found = await guild.members.fetch({ query: searcher, limit: 1 });
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
            if (searcher.toLowerCase() === "self" || (searcher.toLowerCase() === "me" && self)) {
                if (self instanceof GuildMember) return self;

                return await guild.members.fetch(searcher);
            }

            return await guild.members.fetch(searcher);
        } catch (error) {
            return undefined;
        }
    };

    fetchChannel = async (searcher: string, guild?: Guild, limitToGuild = false) => {
        if (searcher.startsWith("<#") && searcher.endsWith(">")) searcher = searcher.slice(2, -1);
        if (searcher.startsWith("#")) searcher = searcher.slice(1);
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
                if (!channel.name) continue;
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

    formatErrorMessage = (error: unknown, useDiscordformatting = true): string => {
        let message = "Unknown error";

        if (error instanceof Error) {
            message = `[${error.name}]: ${error.message}`;
        }

        if (error instanceof SqlError) {
            message = `[${error.code}]: ${error.sqlMessage}`;
        }

        if (error instanceof AxiosError) {
            message = `[${error.code}]: ${JSON.stringify(error.response?.data.errors)}`;
        }

        if (useDiscordformatting) {
            message = `\`\`\`\n${message}\n\`\`\``;
        }

        return message;
    };

    wait = async (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
    };

    clamp = (value: number, min: number, max: number) => {
        return Math.min(Math.max(value, min), max);
    };

    findKeyfromValue = (map: Map<unknown, unknown>, value: unknown) => {
        return [...map].find(([key, val]) => val === value)?.[0];
    };

    GenerateUUID = () => {
        return crypto.randomUUID();
    };

    MemoryUsage = () => {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        return Math.round(used);
    };

    encypt = (text: string, iv: string) => {
        const key = Buffer.from(this.client.config.credentials.encryptionKey, "hex");
        const _iv = Buffer.from(iv, "hex");

        const cipher = createCipheriv("aes256", key, _iv);
        const encryptedMessage = cipher.update(text, "utf8", "hex") + cipher.final("hex");

        return encryptedMessage;
    };

    decrypt = (text: string, iv: string) => {
        const key = Buffer.from(this.client.config.credentials.encryptionKey, "hex");
        const _iv = Buffer.from(iv, "hex");

        const decipher = createDecipheriv("aes256", key, _iv);
        const decryptedMessage = decipher.update(text, "hex", "utf-8") + decipher.final("utf8");

        return decryptedMessage;
    };

    isDev = (userId: string) => {
        return this.client.config.devList.includes(userId);
    };

    makePointlogEmbed = (pointlog: PointLog) => {
        const embed = this.makeInfoEmbed({
            title: `\`${pointlog.id}\``,
            footer: { text: pointlog.id },
            fields: [{ name: "Notes", value: `${pointlog.note || "`No note`"}`, inline: false }],
        });

        const baseDescription = `Created by [${pointlog.creator.robloxUsername}](https://www.roblox.com/users/${pointlog.creator.robloxId}/profile) on <t:${Math.round(pointlog.createdAt.getTime() / 1000)}:F>`;

        for (const data of pointlog.data) {
            const foundField = embed.getField(`> ${data.points} points`);
            if (foundField) {
                foundField.value += `, \`${data.user.robloxUsername}\``;
                if (foundField.value.length > 1024) foundField.value = `${foundField.value.substring(0, 1021)}...`;
                continue;
            }

            embed.addFields({ name: `> ${data.points} points`, value: `\`${data.user.robloxUsername}\`` });

            if (embed.data.fields?.length && embed.data.fields?.length >= 25) {
                embed.setDescription(`## ${Emojis.warning} Unable to show full log!\n${baseDescription}`);
                break;
            }

            embed.setDescription(baseDescription);
        }

        return embed;
    };

    makeInfoEmbed = (options: EmbedOptions) => {
        const embed = new Embed(options);

        if (!options.color) embed.setColor(0x4287f5);
        if (!options.author) {
            embed.setAuthor({ name: "Info", iconURL: Images.info });
        }

        return embed;
    };

    makeWarnEmbed = (options: EmbedOptions) => {
        const embed = new Embed(options);

        if (!options.color) embed.setColor(0xffcc00);
        if (!options.author) {
            embed.setAuthor({ name: "Warning", iconURL: Images.warn });
        }

        return embed;
    };

    makeSuccessEmbed = (options: EmbedOptions) => {
        const embed = new Embed(options);

        if (!options.color) embed.setColor(0x00ff00);
        if (!options.author) {
            embed.setAuthor({ name: "Success", iconURL: Images.check });
        }

        return embed;
    };

    makeErrorEmbed = (options: EmbedOptions) => {
        const embed = new Embed(options);

        if (!options.color) embed.setColor(0xff0000);
        if (!options.author) {
            embed.setAuthor({ name: "Error", iconURL: Images.close });
        }

        return embed;
    };
}
