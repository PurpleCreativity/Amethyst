import mongoose from "mongoose";

import type { Guild, User } from "discord.js";
import type Client from "../classes/Client.ts";
import guildProfile from "../schemas/guildProfile.js";
import type { guildProfileInterface } from "../schemas/guildProfile.ts";
import userProfile from "../schemas/userProfile.js";
import type { userProfileInterface } from "../schemas/userProfile.ts";

export default class Database {
    client: Client;

    private cache = {
        guilds: new Map<string, guildProfileInterface>(),
        users: new Map<string, userProfileInterface>(),
    };

    constructor(client: Client) {
        this.client = client;
    }

    //? Users

    private createUserProfile = async (user: string | User): Promise<userProfileInterface> => {
        if (typeof user === "string") {
            try {
                user = await this.client.users.fetch(user);
            } catch (error) {
                throw new Error("Invalid User or User not found");
            }
        }

        const profile = new userProfile({
            _id: new mongoose.Types.ObjectId(),
            iv: this.client.Functions.GenerateIV(),

            user: {
                id: user.id,
                name: user.username,
            },

            roblox: {
                user: undefined,
                updatedAt: undefined,
            },

            FFlags: new Map(),
            settings: new Map(),
        });

        await profile.setFFlag("CreatedInVersion", this.client.config.version);

        await profile.save();
        this.cache.users.set(user.id, profile);

        return profile;
    };

    fetchUserProfile = async (userId: string, useCache = true): Promise<userProfileInterface> => {
        if (useCache && this.cache.users.has(userId)) return this.cache.users.get(userId) as userProfileInterface;

        const profile = await userProfile.findOne({ "user.id": userId });
        if (!profile) return this.createUserProfile(userId);

        this.cache.users.set(userId, profile);

        return profile;
    };

    fetchUserFromRoblox = async (robloxId: string): Promise<userProfileInterface | undefined> => {
        const profile = await userProfile.findOne({ "roblox.user.id": robloxId });
        if (!profile) return undefined;

        this.cache.users.set(profile.user.id, profile);

        return profile;
    };

    //? Guilds

    createGuildProfile = async (shortname: string, guild: string | Guild): Promise<guildProfileInterface> => {
        if (typeof guild === "string") {
            try {
                guild = await this.client.guilds.fetch(guild);
            } catch (error) {
                throw new Error("Invalid Guild or Guild not found");
            }
        }

        const profile = new guildProfile({
            _id: new mongoose.Types.ObjectId(),
            iv: this.client.Functions.GenerateIV(),
            shortname: shortname,

            guild: {
                id: guild.id,
                name: guild.name,
            },

            roblox: {
                places: new Map(),
            },

            API: {
                enabled: false,
                keys: new Map(),
            },

            commands: new Map(),

            users: new Map(),

            schedule: {
                types: new Map(),
                events: new Map(),
            },

            permissions: new Map()
                .set("Administrator", { name: "Administrator", roles: [], users: [] })
                .set("Moderator", { name: "Moderator", roles: [], users: [] })

                .set("PointsManager", { name: "PointsManager", roles: [], users: [] })
                .set("PointsViewer", { name: "PointsViewer", roles: [], users: [] })
                .set("CreatePointLogs", { name: "CreatePointLogs", roles: [], users: [] })

                .set("EventScheduler", { name: "EventScheduler", roles: [], users: [] })
                .set("EventManager", { name: "EventManager", roles: [], users: [] }),

            channels: new Map()
                .set("PointsDatabaseUpdates", "0")
                .set("PointLogUpdates", "0")
                .set("ScheduleUpdates", "0")
                .set("RobloxGroupLogs", "0")

                .set("Custom1", "0")
                .set("Custom2", "0")
                .set("Custom3", "0")
                .set("Custom4", "0")
                .set("Custom5", "0"),

            FFlags: new Map(),
            settings: new Map(),
        });

        await profile.setFFlag("CreatedInVersion", this.client.config.version);

        await profile.save();
        this.cache.guilds.set(guild.id, profile);

        return profile;
    };

    fetchGuildProfile = async (guildId: string, useCache = true): Promise<guildProfileInterface | undefined> => {
        if (useCache && this.cache.guilds.has(guildId)) return this.cache.guilds.get(guildId) as guildProfileInterface;

        const profile = await guildProfile.findOne({ "guild.id": guildId });
        //if (!profile) return this.createGuildProfile(guild);
        if (!profile) return undefined;

        this.cache.guilds.set(guildId, profile);
        return profile;
    };

    fetchGuildFromShortname = async (shortname: string): Promise<guildProfileInterface | undefined> => {
        const profile = await guildProfile.findOne({ shortname: shortname });
        if (!profile) return undefined;

        this.cache.guilds.set(profile.guild.id, profile);
        return profile;
    };

    clearCache = () => {
        this.cache.guilds.clear();
        this.cache.users.clear();
    };

    isConnected = () => mongoose.connection.readyState === 1;

    Init = async () => {
        try {
            await mongoose.connect(this.client.config.credentials.databaseURI);
        } catch (error) {
            this.client.error("Failed to connect to database");
            this.client.error(error);
        }

        if (this.isConnected()) this.client.success("Connected to Database");
    };
}
