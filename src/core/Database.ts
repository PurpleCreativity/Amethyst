import type { Guild, Snowflake, User } from "discord.js";
import type SuperClient from "../classes/SuperClient.js";
import guildProfile, { type guildProfileInterface } from "../schemas/guildProfile.js";
import userProfile, { type userProfileInterface } from "../schemas/userProfile.js";
import crypto from "node:crypto";

export default class Database {
    client: SuperClient;

    cache = {
        guilds: new Map<string, guildProfileInterface>(),
        users: new Map<string, userProfileInterface>(),
    }

    locks = {
        guilds: [] as string[],
        users: [] as string[],
    }

    constructor(client: SuperClient) {
        this.client = client;
    }

    CreateGuildProfile = async (guild: Guild | string | Snowflake): Promise<guildProfileInterface> => {
        let actualGuild: Guild | undefined;
        if (typeof guild === "string") actualGuild = await this.client.Functions.GetGuild(guild, false) as Guild; else actualGuild = guild;
        if (!actualGuild) throw new Error("Guild not found");

        const newGuildProfile = new guildProfile({
            _id: new this.client.Mongoose.Types.ObjectId(),
            iv: crypto.randomBytes(16).toString("hex"),

            guild: {
                id: actualGuild.id,
                shortname: this.client.Functions.CreateAcronym(actualGuild.name),

                channels: new Map()
                    .set("BotAnnouncements", { name: "BotAnnouncements", id: "0" })

                    .set("PointsDatabaseUpdates", { name: "PointsDatabaseUpdates", id: "0" })
                    .set("PointLogUpdates", { name: "PointLogUpdates", id: "0" })
                    .set("ScheduleUpdates", { name: "ScheduleUpdates", id: "0" })
                    .set("GameLogs", { name: "GameLogs", id: "0" })
                    .set("GameCalls", { name: "GameCalls", id: "0" })
                    .set("RobloxGroupLogs", { name: "RobloxGroupLogs", id: "0" })

                    .set("Custom1", { name: "Custom1", id: "0" })
                    .set("Custom2", { name: "Custom2", id: "0" })
                    .set("Custom3", { name: "Custom3", id: "0" })
                ,

                customPermissions: new Map()
                    .set("Administrator", { name: "Administrator", roles: [], users: [] })
                    .set("Moderator", { name: "Moderator", roles: [], users: [] })

                    .set("RobloxModerator", { name: "RobloxModerator", roles: [], users: [] })
                    .set("RobloxGroupManager", { name: "RobloxGroupManager", roles: [], users: [] })

                    .set("PointsManager", { name: "PointsManager", roles: [], users: [] })
                    .set("PointsViewer", { name: "PointsViewer", roles: [], users: [] })

                    .set("CreatePointLogs", { name: "CreatePointLogs", roles: [], users: [] })

                    .set("EventScheduler", { name: "EventScheduler", roles: [], users: [] })
                    .set("ScheduleManager", { name: "ScheduleManager", roles: [], users: [] })
                ,
            },

            binds: new Map(),

            modules: new Map()
                .set("Points", { name: "Points", enabled: true })
                .set("Schedule", { name: "Schedule", enabled: true })
                .set("Utility", { name: "Utility", enabled: true })
                .set("Moderation", { name: "Moderation", enabled: true })
            ,

            users: new Map(),
            pointlogs: new Map(),

            flags: new Map()
                .set("CreationVersion", { name: "CreationVersion", value: this.client.config.version })
            ,

            schedule: {
                scheduled: new Map(),
                types: new Map(),
            },

            API: {
                keys: new Map(),

                enabled: true,
                banned: false,
            },

            roblox: {
                groupId: 0,

                rover_Key: null,
                bloxlink_Key: null,

                trackedGroups: new Map(),
                places: new Map(),
            },

            settings: new Map()
                .set("PublicSchedule", { name: "PublicSchedule", description: "Whether or not the schedule is publicly avaible via the API", devOnly: false, value: true })
            ,

            linkedGuilds: new Map(),
        })

        await newGuildProfile.save();
        this.cache.guilds.set(actualGuild.id, newGuildProfile as any as guildProfileInterface);

        return newGuildProfile as any as guildProfileInterface;
    }

    GetGuildProfile = async (guildId: string, useCache = true): Promise<guildProfileInterface | undefined> => {
        if (useCache) {
            const cachedGuild = this.cache.guilds.get(guildId.toString());
            if (cachedGuild) return cachedGuild;
        }

        const guildDataProfile = await guildProfile.findOne({ "guild.id": guildId });
        //if (!guildDataProfile && createIfnull) {
        //    this.cache.guilds.set(guildId.toString(), guildDataProfile as any as guildProfileInterface);
        //    return await this.CreateGuildProfile(guildId);
        //}

        return guildDataProfile as any as guildProfileInterface || undefined;
    }

    GetAllGuilds = async (useCache = true): Promise<guildProfileInterface[]> => {
        if (useCache) {
            return Array.from(this.cache.guilds.values());
        }

        const guilds = [] as guildProfileInterface[];
        const guildDataProfiles = await guildProfile.find();

        for (const guildDataProfile of guildDataProfiles) {
            guilds.push(guildDataProfile as any as guildProfileInterface);
        }

        return guilds;
    }

    CreateUserProfile = async (user: string | User | Snowflake): Promise<userProfileInterface> => {
        let actualUser: User | undefined;
        if (typeof user === "string") actualUser = await this.client.Functions.GetUser(user, undefined, undefined) as User; else actualUser = user;
        if (!actualUser) throw new Error("User not found");

        const newUserProfile = new userProfile({
            _id: new this.client.Mongoose.Types.ObjectId(),
            iv: crypto.randomBytes(16).toString("hex"),

            user: {
                id: actualUser.id,
                name: actualUser.username,
            },

            roblox: {
                username: "",
                id: 0,
            },

            flags: new Map()
                .set("CreationVersion", { name: "CreationVersion", value: this.client.config.version })
            ,


            settings: new Map()
                .set("ScheduleDMReminder", { name: "ScheduleDMReminder", description: "Whether or not to send a DM when a schedule is about to start", devOnly: false, value: true })
            ,
        })

        await newUserProfile.save();
        this.cache.users.set(actualUser.id, newUserProfile as any as userProfileInterface);

        return newUserProfile as any as userProfileInterface;
    }

    GetUserProfile = async (userId: string, useCache = true): Promise<userProfileInterface> => {
        if (useCache) {
            const cachedUser = this.cache.users.get(userId);
            if (cachedUser) return cachedUser;
        }

        const userDataProfile = await userProfile.findOne({ "user.id": userId });
        if (!userDataProfile) return await this.CreateUserProfile(userId);

        this.cache.users.set(userId, userDataProfile as any as userProfileInterface);

        return userDataProfile as any as userProfileInterface;
    }

    GetUserProfileByRobloxId = async (robloxId: number, useCache = true): Promise<userProfileInterface> => {
        if (useCache) {
            for (const user of this.cache.users.values()) {
                if (user.roblox.id === robloxId) return user;
            }
        }

        const userDataProfile = await userProfile.findOne({ "roblox.id": robloxId });
        if (!userDataProfile) throw new Error("User not found");

        return userDataProfile as any as userProfileInterface;
    }
    
    UpdateCache = async () => {
        const guilds = await guildProfile.find();
        for (const guild of guilds) {
            if (!guild.guild || !guild.guild.id) {
                this.client.warn("A guild has been found without the guild object or guildId, deleting it.")
                await guildProfile.deleteOne()
                continue;
            }
            this.cache.guilds.set(guild.guild.id.toString(), guild as any as guildProfileInterface);
        }

        const users = await userProfile.find();
        for (const user of users) {
            if (!user.user || !user.user.id) {
                this.client.warn("A user has been found without the user object or userId, deleting it.")
                await userProfile.deleteOne()
                continue;
            }
            this.cache.users.set(user.user.id, user as any as userProfileInterface);
        }

        this.client.log("Updated Database Cache");
    }

    IsConnected = async () => {
        return this.client.Mongoose.connection.readyState === 1
    }

    Init = async () => {
        try {
            await this.client.Mongoose.connect(this.client.config.credentials.databaseURL)
        } catch (error) {
            this.client.error("Failed to connect to database");
            this.client.error(error);
        }

        if (await this.IsConnected()) this.client.success("Connected to Database");
        else {
            this.client.error("Failed to connect to database");
            return;
        }

        this.client.Threader.CreateThread("DatabaseCache", this.UpdateCache).Loop(1000 * 60 * 10);

        this.client.success("Initialized Database");
    }
}