import type { ColorResolvable, Guild, GuildMember, TextChannel } from "discord.js";
import mongoose from "mongoose";
import client from "../main.js";

export type guildUser = {
    user: {
        name: string;
        id: string;
    };

    points: number;

    note: {
        text?: string;
        visible: boolean;

        updatedAt: Date;
    };

    ranklock: {
        rank: NumberRange<0, 255>; // Roblox group rank (0-255)

        shadow: boolean;
        reason?: string;

        updatedAt: Date;
    };
};

export type Permission = {
    name: string;
    roles: string[];
    users: string[];
};

export type APIKey = {
    name: string;
    key: string;

    enabled: boolean;
    permissions: string[];

    createdAt: Date;
    createdBy: string;
};

export type robloxPlace = {
    name: string;
    id: string; // placeId, not UniverseId
    key: string; // API Key
};

export type PointLog = {
    id: string;

    creator: {
        name: string;
        id: string;
    };

    data: {
        name: string;
        id: string;

        points: number;
    }[];
    notes: string | undefined;

    createdAt: Date;
};

export type ScheduleEventType = {
    name: string;
    icon: string;
    color: ColorResolvable;

    description: string;

    useRobloxSchedule: boolean;
    useDiscordSchedule: boolean;

    canSchedule: { roles: string[]; users: string[] };
};

export type ScheduledEvent = {
    id: string;

    time: number; // In Minutes
    duration: number; // In Minutes

    placeId?: number;
    notes?: string;

    host: {
        name: string;
        id: string;
    };

    eventType: string;
    ongoing: boolean;

    discordEventId: string;
    robloxEventId: string;
};

interface guildProfileInterface extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    iv: string;
    shortname: string;

    guild: {
        id: string;
        name: string;
    };

    roblox: {
        groupId: number | undefined;

        places: Map<string, robloxPlace>;
    };

    API: {
        rover_Key: string | undefined;
        bloxlink_Key: string | undefined;

        enabled: boolean;
        keys: Map<string, APIKey>;
    };

    commands: Map<string, boolean>;

    users: Map<string, guildUser>;

    schedule: {
        types: Map<string, ScheduleEventType>;
        events: Map<string, ScheduledEvent>;
    };

    permissions: Map<string, Permission>;
    channels: Map<string, string>;

    FFlags: Map<string, unknown>;
    settings: Map<string, unknown>;

    fetchGuild: () => Promise<Guild>;

    getCommandState: (commandName: string) => boolean;
    setCommandState: (commandName: string, state: boolean) => Promise<guildProfileInterface>;

    getFFlag: (FFlagName: string) => unknown;
    setFFlag: (FFlagName: string, value: unknown) => Promise<guildProfileInterface>;

    getSetting: (settingName: string) => unknown;
    setSetting: (settingName: string, value: unknown) => Promise<guildProfileInterface>;

    getChannel: (channelName: string) => Promise<TextChannel>;
    setChannel: (channelName: string, id: string) => Promise<guildProfileInterface>;

    getPermission: (permissionName: string) => Permission;
    checkPermissions: (user: GuildMember, requiredPermissions: string[]) => boolean;

    addUserToPermission: (permissionName: string, userId: string) => Promise<guildProfileInterface>;
    removeUserFromPermission: (permissionName: string, userId: string) => Promise<guildProfileInterface>;
    setUsersToPermission: (permissionName: string, userIds: string[]) => Promise<guildProfileInterface>;

    addRoleToPermission: (permissionName: string, roleId: string) => Promise<guildProfileInterface>;
    removeRoleFromPermission: (permissionName: string, roleId: string) => Promise<guildProfileInterface>;
    setRolesToPermission: (permissionName: string, roleIds: string[]) => Promise<guildProfileInterface>;

    addUser: (robloxUser: { id: string; name: string }) => Promise<guildProfileInterface>;
    getUser: (robloxId: string) => Promise<guildProfileInterface>;

    calculatePendingPoints: (robloxId: string) => number;
    setNote: (robloxId: string, note: string, visible?: boolean) => Promise<guildProfileInterface>;
    setRankLock: (
        robloxId: string,
        rank: NumberRange<0, 255>,
        shadow?: boolean,
        reason?: string,
    ) => Promise<guildProfileInterface>;

    addPointLog: (log: PointLog) => Promise<guildProfileInterface>;
    getPointLog: (logId: string) => PointLog;
    removePointLog: (logId: string) => Promise<guildProfileInterface>;
    updatePointLog: (logId: string, log: PointLog) => Promise<guildProfileInterface>;
    getPointLogs: (query?: { creatorName?: string; targetName?: string }) => PointLog[];

    addScheduledEvent: (event: ScheduledEvent) => Promise<guildProfileInterface>;
    getScheduledEvent: (eventId: string) => ScheduledEvent;
    removeScheduledEvent: (eventId: string) => Promise<guildProfileInterface>;
    updateScheduledEvent: (eventId: string, event: ScheduledEvent) => Promise<guildProfileInterface>;
    getScheduledEvents: (query?: { hostName?: string; eventType?: string }) => ScheduledEvent[];

    addScheduleType: (type: ScheduleEventType) => Promise<guildProfileInterface>;
    getScheduleType: (name: string) => ScheduleEventType;
    removeScheduleType: (name: string) => Promise<guildProfileInterface>;
    updateScheduleType: (name: string, scheduleType: ScheduleEventType) => Promise<guildProfileInterface>;
    getScheduleTypes: () => ScheduleEventType[];

    getAPIKey: (keyName: string) => APIKey;
    addAPIKey: (key: APIKey) => Promise<guildProfileInterface>;
    removeAPIKey: (keyName: string) => Promise<guildProfileInterface>;
    updateAPIKey: (keyName: string, key: APIKey) => Promise<guildProfileInterface>;
    validateAPIKey: (key: string) => boolean;
}

const guildProfileSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    iv: { type: String, required: true },
    shortname: { type: String, unique: true, required: true },

    guild: {
        id: { type: String, required: true },
        name: { type: String, required: true },
    },

    roblox: {
        groupId: { type: Number, required: false },
        places: {
            type: Map,
            of: {
                name: { type: String, required: true },
                id: { type: String, required: true },
                key: { type: String, required: true },
            },
        },
    },

    API: {
        rover_Key: { type: String, required: false },
        bloxlink_Key: { type: String, required: false },
        enabled: { type: Boolean, required: true, default: false },
        keys: {
            type: Map,
            of: {
                name: { type: String, required: true },
                key: { type: String, required: true },
                enabled: { type: Boolean, required: true },
                permissions: [String],
                createdAt: { type: Date, required: true },
                createdBy: { type: String, required: true },
            },
        },
    },

    commands: {
        type: Map,
        of: Boolean,
    },

    users: {
        type: Map,
        of: {
            user: {
                name: { type: String, required: true },
                id: { type: String, required: true },
            },
            points: { type: Number, required: true },
            note: {
                text: { type: String, required: false },
                visible: { type: Boolean, required: true },
                updatedAt: { type: Date, required: true },
            },
            ranklock: {
                rank: { type: Number, required: true },
                shadow: { type: Boolean, required: true },
                reason: { type: String, required: false },
                updatedAt: { type: Date, required: true },
            },
        },
    },

    schedule: {
        types: {
            type: Map,
            of: {
                name: { type: String, required: true },
                icon: { type: String, required: true },
                color: { type: String, required: true },
                description: { type: String, required: true },
                useRobloxSchedule: { type: Boolean, required: true },
                useDiscordSchedule: { type: Boolean, required: true },
                canSchedule: {
                    roles: [String],
                    users: [String],
                },
            },
        },
        events: {
            type: Map,
            of: {
                id: { type: String, required: true },
                time: { type: Number, required: true },
                duration: { type: Number, required: true },
                placeId: { type: Number, required: false },
                notes: { type: String, required: false },
                host: {
                    name: { type: String, required: true },
                    id: { type: String, required: true },
                },
                eventType: { type: String, required: true },
                ongoing: { type: Boolean, required: true },
                discordEventId: { type: String, required: true },
                robloxEventId: { type: String, required: true },
            },
        },
    },

    permissions: {
        type: Map,
        of: {
            name: { type: String, required: true },
            roles: [String],
            users: [String],
        },
    },

    channels: {
        type: Map,
        of: String,
    },

    FFlags: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
    },

    settings: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
    },
});

guildProfileSchema.methods.fetchGuild = async function () {
    return await client.guilds.fetch(this.guild.id);
};

//? FFlags

guildProfileSchema.methods.getCommandState = function (commandName: string) {
    return this.commands.get(commandName);
};

guildProfileSchema.methods.setCommandState = async function (commandName: string, state: boolean) {
    this.commands.set(commandName, state);

    return await this.save();
};

guildProfileSchema.methods.getFFlag = function (FFlagName: string) {
    return this.FFlags.get(FFlagName);
};

guildProfileSchema.methods.setFFlag = async function (FFlagName: string, value: unknown) {
    this.FFlags.set(FFlagName, value);

    return await this.save();
};

//? Settings

guildProfileSchema.methods.getSetting = function (settingName: string) {
    return this.settings.get(settingName);
};

guildProfileSchema.methods.setSetting = async function (settingName: string, value: unknown) {
    this.settings.set(settingName, value);

    return await this.save();
};

//? Channels

guildProfileSchema.methods.getChannel = async function (channelName: string) {
    if (!this.channels.has(channelName)) return undefined;
    const id = this.channels.get(channelName);
    if (id === "" || id === "0") return undefined;

    return await client.channels.fetch(id);
};

guildProfileSchema.methods.setChannel = async function (channelName: string, id: string) {
    this.channels.set(channelName, id);

    return await this.save();
};

//? Permissions

guildProfileSchema.methods.getPermission = function (permissionName: string) {
    return this.permissions.get(permissionName);
};

guildProfileSchema.methods.checkPermissions = function (user: GuildMember, requiredPermissions: string[]) {
    const userRoles = user.roles.cache.map((role) => role.id);

    if (user.permissions.has("Administrator")) return true;

    const ownedPermissions: string[] = [];

    for (const permissionName of requiredPermissions) {
        const permission = this.permissions.get(permissionName);

        if (permission.roles.some((role: string) => userRoles.includes(role))) ownedPermissions.push(permissionName);
        if (permission.users.includes(user.id)) ownedPermissions.push(permissionName);
    }

    if (ownedPermissions.length === requiredPermissions.length) return true;

    return false;
};

// Permission/Users

guildProfileSchema.methods.addUserToPermission = async function (permissionName: string, userId: string) {
    this.permissions.get(permissionName).users.push(userId);

    return await this.save();
};

guildProfileSchema.methods.removeUserFromPermission = async function (permissionName: string, userId: string) {
    this.permissions.get(permissionName).users = this.permissions
        .get(permissionName)
        .users.filter((user: string) => user !== userId);

    return await this.save();
};

guildProfileSchema.methods.setUsersToPermission = async function (permissionName: string, userIds: string[]) {
    this.permissions.get(permissionName).users = userIds;

    return await this.save();
};

// Permission/Roles

guildProfileSchema.methods.addRoleToPermission = async function (permissionName: string, roleId: string) {
    this.permissions.get(permissionName).roles.push(roleId);

    return await this.save();
};

guildProfileSchema.methods.removeRoleFromPermission = async function (permissionName: string, roleId: string) {
    this.permissions.get(permissionName).roles = this.permissions
        .get(permissionName)
        .roles.filter((role: string) => role !== roleId);

    return await this.save();
};

guildProfileSchema.methods.setRolesToPermission = async function (permissionName: string, roleIds: string[]) {
    this.permissions.get(permissionName).roles = roleIds;

    return await this.save();
};

//? Users

guildProfileSchema.methods.addUser = async function (robloxUser: { id: string; name: string }) {
    const userId = robloxUser.id;

    const user = {
        user: {
            name: robloxUser.name,
            id: userId,
        },

        points: 0,

        note: {
            text: undefined,
            visible: true,

            updatedAt: new Date(),
        },

        ranklock: {
            rank: 0,
            shadow: false,
            reason: undefined,

            updatedAt: new Date(),
        },
    };

    this.users.set(userId, user);
    return await this.save();
};

guildProfileSchema.methods.getUser = async function (robloxId: string) {
    if (this.users.has(robloxId)) return this.users.get(robloxId);

    try {
        const rbxUser = await client.Wrapblox.fetchUser(robloxId);

        return (await this.addUser({ id: rbxUser.id.toString(), name: rbxUser.name })).users.get(robloxId);
    } catch (error) {
        throw new Error("Invalid User or User not found");
    }
};

guildProfileSchema.methods.calculatePendingPoints = function (robloxId: string) {
    const logs = this.getPointLogs({ targetId: robloxId });

    let points = 0;
    for (const log of logs) {
        for (const data of log.data) {
            points += data.points;
        }
    }

    return points;
};

guildProfileSchema.methods.setNote = async function (robloxId: string, note: string, visible?: boolean) {
    const user = await this.getUser(robloxId);

    user.note.text = note;
    user.note.visible = visible ?? true;
    user.note.updatedAt = new Date();

    return await this.save();
};

guildProfileSchema.methods.setRankLock = async function (
    robloxId: string,
    rank: NumberRange<0, 255>,
    shadow?: boolean,
    reason?: string,
) {
    const user = await this.getUser(robloxId);

    user.ranklock.rank = rank;
    user.ranklock.shadow = shadow ?? false;
    user.ranklock.reason = reason;
    user.ranklock.updatedAt = new Date();

    return await this.save();
};

//? Point logs

guildProfileSchema.methods.addPointLog = async function (log: PointLog) {
    this.pointLogs.set(log.id, log);

    return await this.save();
};

guildProfileSchema.methods.getPointLog = function (logId: string) {
    return this.pointLogs.get(logId);
};

guildProfileSchema.methods.removePointLog = async function (logId: string) {
    this.pointLogs = new Map([...this.pointLogs].filter(([key, log]: [string, PointLog]) => log.id !== logId));

    return await this.save();
};

guildProfileSchema.methods.updatePointLog = async function (logId: string, log: PointLog) {
    this.pointLogs.set(logId, log);

    return await this.save();
};

guildProfileSchema.methods.getPointLogs = function (query?: { creatorName?: string; targetName?: string }) {
    if (!query) return this.pointLogs;

    const { creatorName, targetName } = query;
    return (
        Array.from(this.pointLogs.values()).filter(
            (log: unknown) =>
                (creatorName ? (log as PointLog).creator.name === creatorName : true) &&
                (targetName ? (log as PointLog).data.some((data) => data.name === targetName) : true),
        ) || []
    );
};

//? Schedule

guildProfileSchema.methods.addScheduledEvent = async function (event: ScheduledEvent) {
    this.schedule.events.set(event.id, event);

    return await this.save();
};

guildProfileSchema.methods.getScheduledEvent = function (eventId: string) {
    return this.schedule.events.get(eventId);
};

guildProfileSchema.methods.removeScheduledEvent = async function (eventId: string) {
    this.schedule.events = new Map(
        [...this.schedule.events].filter(([key, event]: [string, ScheduledEvent]) => event.id !== eventId),
    );

    return await this.save();
};

guildProfileSchema.methods.updateScheduledEvent = async function (eventId: string, event: ScheduledEvent) {
    this.schedule.events.set(eventId, event);

    return await this.save();
};

guildProfileSchema.methods.getScheduledEvents = function (query?: { hostName?: string; eventType?: string }) {
    if (!query) return this.schedule.events;

    const { hostName, eventType } = query;
    return (
        Array.from(this.schedule.events.values()).filter(
            (event: unknown) =>
                (hostName ? (event as ScheduledEvent).host.name === hostName : true) &&
                (eventType ? (event as ScheduledEvent).eventType === eventType : true),
        ) || []
    );
};

//? Schedule Types

guildProfileSchema.methods.addScheduleType = async function (type: ScheduleEventType) {
    this.schedule.types.set(type.name, type);

    return await this.save();
};

guildProfileSchema.methods.getScheduleType = function (name: string) {
    return this.schedule.types.get(name);
};

guildProfileSchema.methods.removeScheduleType = async function (name: string) {
    this.schedule.types = new Map(
        [...this.schedule.types].filter(([key, type]: [string, ScheduleEventType]) => type.name !== name),
    );

    return await this.save();
};

guildProfileSchema.methods.updateScheduleType = async function (name: string, scheduleType: ScheduleEventType) {
    this.schedule.types.set(name, scheduleType);

    return await this.save();
};

guildProfileSchema.methods.getScheduleTypes = function () {
    return Array.from(this.schedule.types.values());
};

//? API

guildProfileSchema.methods.getAPIKey = function (keyName: string) {
    return this.API.keys.get(keyName);
};

guildProfileSchema.methods.addAPIKey = async function (key: APIKey) {
    this.API.keys.set(key.name, key);

    return await this.save();
};

guildProfileSchema.methods.removeAPIKey = async function (keyName: string) {
    this.API.keys = new Map([...this.API.keys].filter(([key, value]: [string, APIKey]) => value.name !== keyName));

    return await this.save();
};

guildProfileSchema.methods.updateAPIKey = async function (keyName: string, key: APIKey) {
    this.API.keys.set(keyName, key);

    return await this.save();
};

guildProfileSchema.methods.validateAPIKey = function (key: string) {
    return Array.from(this.API.keys.values()).some(
        (apiKey) => (apiKey as APIKey).key === client.Functions.Decrypt(key, this.iv),
    );
};

const guildProfile = mongoose.model<guildProfileInterface>("Guild", guildProfileSchema);

export default guildProfile;
export type { guildProfileInterface, guildProfileSchema };
