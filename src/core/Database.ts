/*
    Mongoose really does not seem to like Deno
    Types in your IDE will not work,
    but the code will still run and pass the typescript compiler
*/

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

    fetchUserProfile = async (user: string | User, useCache = true): Promise<userProfileInterface> => {
        try {
            if (typeof user === "string") user = await this.client.users.fetch(user);
        } catch (error) {
            throw new Error("Invalid User or User not found");
        }

        if (useCache && this.cache.users.has(user.id)) return this.cache.users.get(user.id) as userProfileInterface;

        const profile = await userProfile.findOne({ "user.id": user.id });
        if (!profile) return this.createUserProfile(user);

        this.cache.users.set(user.id, profile);

        return profile;
    };

    fetchUserFromRoblox = async (robloxId: string): Promise<userProfileInterface | undefined> => {
        const profile = await userProfile.findOne({ "roblox.user.id": robloxId });
        if (!profile) return undefined;

        this.cache.users.set(profile.user.id, profile);

        return profile;
    };

    //? Guilds

    createGuildProfile = async (guild: string | Guild): Promise<guildProfileInterface> => {
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

            guild: {
                id: guild.id,
                name: guild.name,
            },

            roblox: {
                groupId: undefined,
                places: new Map(),
            },

            API: {
                rover_Key: undefined,
                bloxlink_Key: undefined,

                enabled: false,
                keys: new Map(),
            },

            users: new Map(),

            schedule: {
                types: new Map(),
                events: new Map(),
            },

            permissions: new Map(),
            channels: new Map(),

            FFlags: new Map(),
            settings: new Map(),
        });

        await profile.setFFlag("CreatedInVersion", this.client.config.version);

        await profile.save();
        this.cache.guilds.set(guild.id, profile);

        return profile;
    };

    fetchGuildProfile = async (guild: string | Guild, useCache = true): Promise<guildProfileInterface | undefined> => {
        try {
            if (typeof guild === "string") guild = await this.client.guilds.fetch(guild);
        } catch (error) {
            throw new Error("Invalid Guild or Guild not found");
        }

        if (useCache && this.cache.guilds.has(guild.id))
            return this.cache.guilds.get(guild.id) as guildProfileInterface;

        const profile = await guildProfile.findOne({ "guild.id": guild.id });
        //if (!profile) return this.createGuildProfile(guild);
        if (!profile) return undefined;

        this.cache.guilds.set(guild.id, profile);

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
