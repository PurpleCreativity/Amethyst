import type { Guild, Snowflake } from "discord.js";
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

        const owner = await actualGuild.fetchOwner().then((owner) => owner.user);

        const newGuildProfile = new guildProfile({
            _id: new this.client.Mongoose.Types.ObjectId(),
            iv: crypto.randomBytes(16).toString("hex"),

            guild: {
                id: actualGuild.id,
                shortname: this.client.Functions.CreateAcronym(actualGuild.name),

                channels: new Map()
                    .set("PointsDatabaseUpdates", { name: "PointsDatabaseUpdates", id: null })
                    .set("PointLogUpdates", { name: "PointLogUpdates", id: null })
                    .set("ScheduleUpdates", { name: "ScheduleUpdates", id: null })
                    .set("GameLogs", { name: "GameLogs", id: null })
                    .set("RobloxGroupLogs", { name: "RobloxGroupLogs", id: null })
                    .set("RobloxCalls", { name: "RobloxCalls", id: null }),

                permissions: new Map()
                    .set("Administrator", { name: "Administrator", roles: [], users: [owner.id] })
                    .set("Moderator", { name: "Moderator", roles: [], users: [owner.id] })

                    .set("RobloxModerator", { name: "RobloxModerator", roles: [], users: [owner.id] })
                    .set("RobloxGroupManager", { name: "RobloxGroupManager", roles: [], users: [owner.id] })

                    .set("PointsManager", { name: "PointsManager", roles: [], users: [owner.id] })
                    .set("PointsViewer", { name: "PointsViewer", roles: [], users: [owner.id] })

                    .set("CreatePointLogs", { name: "CreatePointLogs", roles: [], users: [owner.id] })

                    .set("EventScheduler", { name: "EventScheduler", roles: [], users: [owner.id] })
                    .set("ScheduleManager", { name: "ScheduleManager", roles: [], users: [owner.id] })
                ,
            },

            users: new Map(),
            pointlogs: new Map(),

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

                places: new Map(),
            },

            settings: new Map()
                    .set("publicSchedule", { name: "Public Schedule", description: "Whether or not the schedule is public", value: true })
            ,

            linkedGuilds: new Map(),
        })

        await newGuildProfile.save();
        this.cache.guilds.set(actualGuild.id, newGuildProfile as any as guildProfileInterface);

        return newGuildProfile as any as guildProfileInterface;
    }

    GetGuildProfile = async (guildId: number, useCache = true): Promise<guildProfileInterface> => {
        if (useCache) {
            const cachedGuild = this.cache.guilds.get(guildId.toString());
            if (cachedGuild) return cachedGuild;
        }

        const guildDataProfile = await guildProfile.findOne({ "guild.id": guildId });
        if (!guildDataProfile) throw new Error("Guild not found");

        this.cache.guilds.set(guildId.toString(), guildDataProfile as any as guildProfileInterface);

        return guildDataProfile as any as guildProfileInterface;
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

    Init = async () => {
        this.client.success("Initialized Database");
    }
}