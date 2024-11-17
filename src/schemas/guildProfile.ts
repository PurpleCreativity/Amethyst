import type { ColorResolvable, Guild, GuildMember, TextChannel } from "discord.js";
import mongoose from "mongoose";
import type { Group } from "noblox.js";
import client from "../main.js";
import type { NumberRange } from "../types/custom.js";
import type { ValidPermissions } from "../types/global.js";

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
    roles: string[];
    users: string[];
};

export type APIKey = {
    key: string;

    enabled: boolean;
    permissions: ValidPermissions[];

    createdAt: Date;
    createdBy: string;
};

export type robloxPlace = {
    id: string; // placeId, not UniverseId
    key: string; // API Key
};

export type PointLog = {
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
    icon: string;
    color: ColorResolvable;

    description: string;

    useRobloxSchedule: boolean;
    useDiscordSchedule: boolean;

    canSchedule: { roles: string[]; users: string[] };
};

export type ScheduledEvent = {
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
        groupId: string | undefined;

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
    pointLogs: Map<string, PointLog>;

    schedule: {
        types: Map<string, ScheduleEventType>;
        events: Map<string, ScheduledEvent>;
    };

    permissions: Map<string, Permission>;
    channels: Map<string, string>;

    FFlags: Map<string, unknown>;
    settings: Map<string, unknown>;

    fetchGuild: () => Promise<Guild | undefined>;
    linkGroup: (groupId: string) => void;
    fetchGroup: () => Promise<Group | undefined>;

    getCommandState: (commandName: string) => boolean;
    setCommandState: (commandName: string, enabled: boolean) => void;

    getFFlag: (FFlagName: string) => unknown;
    setFFlag: (FFlagName: string, value: unknown) => void;

    getSetting: (settingName: string) => unknown;
    setSetting: (settingName: string, value: unknown) => void;

    getPermission: (permissionName: string) => Permission;
    checkPermissions: (user: GuildMember, requiredPermissions: string[]) => boolean;

    addUserToPermission: (permissionName: string, userId: string) => void;
    removeUserFromPermission: (permissionName: string, userId: string) => void;
    setUsersToPermission: (permissionName: string, userIds: string[]) => void;

    addRoleToPermission: (permissionName: string, roleId: string) => void;
    removeRoleFromPermission: (permissionName: string, roleId: string) => void;
    setRolesToPermission: (permissionName: string, roleIds: string[]) => void;

    getChannel: (channelName: string) => Promise<TextChannel | undefined>;
    setChannel: (channelName: string, id: string) => void;

    getUser: (robloxId: string) => Promise<guildUser>;
    addUser: (robloxUser: { id: string; name: string }) => Promise<void>;

    calculatePendingPoints: (robloxId: string) => number;
    setNote: (robloxId: string, note: string, visible?: boolean) => void;
    setRankLock: (robloxId: string, rank: NumberRange<0, 255>, shadow?: boolean, reason?: string) => void;

    addPointLog: (logId: string, log: PointLog) => void;
    getPointLog: (logId: string) => PointLog;
    removePointLog: (logId: string) => void;
    updatePointLog: (logId: string, log: PointLog) => void;
    getPointLogs: (query?: {
        creatorName?: string;
        creatorId?: string;
        targetName?: string;
        targetId?: string;
    }) => PointLog[];

    addScheduledEvent: (eventId: string, event: ScheduledEvent) => void;
    getScheduledEvent: (eventId: string) => ScheduledEvent;
    removeScheduledEvent: (eventId: string) => void;
    updateScheduledEvent: (eventId: string, event: ScheduledEvent) => void;
    getScheduledEvents: (query?: { hostName?: string; hostId?: string; eventType?: string }) => ScheduledEvent[];

    addScheduleType: (name: string, scheduleType: ScheduleEventType) => void;
    getScheduleType: (name: string) => ScheduleEventType;
    removeScheduleType: (name: string) => void;
    updateScheduleType: (name: string, scheduleType: ScheduleEventType) => void;
    getScheduleTypes: () => ScheduleEventType[];

    getAPIKey: (keyName: string) => APIKey;
    addAPIKey: (name: string, APIkey: APIKey) => void;
    removeAPIKey: (name: string) => void;
    updateAPIKey: (name: string, APIkey: APIKey) => void;
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
        groupId: { type: String, required: false },
        places: {
            type: Map,
            of: {
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
        of: { type: Boolean, default: true },
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
    pointLogs: {
        type: Map,
        of: {
            creator: {
                name: { type: String, required: true },
                id: { type: String, required: true },
            },
            data: [
                {
                    name: { type: String, required: true },
                    id: { type: String, required: true },
                    points: { type: Number, required: true },
                },
            ],
            notes: { type: String, required: false },
            createdAt: { type: Date, required: true },
        },
    },

    schedule: {
        types: {
            type: Map,
            of: {
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

guildProfileSchema.methods.linkGroup = function (groupId: string) {
    this.roblox.groupId = groupId;
};

guildProfileSchema.methods.fetchGroup = async function () {
    if (this.roblox.groupId === "0") return undefined;

    return await client.noblox.getGroup(Number.parseInt(this.roblox.groupId));
};

//? FFlags

guildProfileSchema.methods.getCommandState = function (commandName: string) {
    return this.commands.get(commandName);
};

guildProfileSchema.methods.setCommandState = function (commandName: string, enabled: boolean) {
    this.commands.set(commandName, enabled);
};

guildProfileSchema.methods.getFFlag = function (FFlagName: string) {
    return this.FFlags.get(FFlagName);
};

guildProfileSchema.methods.setFFlag = function (FFlagName: string, value: unknown) {
    this.FFlags.set(FFlagName, value);
};

//? Settings

guildProfileSchema.methods.getSetting = function (settingName: string) {
    return this.settings.get(settingName);
};

guildProfileSchema.methods.setSetting = function (settingName: string, value: unknown) {
    this.settings.set(settingName, value);
};

//? Channels

guildProfileSchema.methods.getChannel = async function (channelName: string) {
    if (!this.channels.has(channelName)) return undefined;
    const id = this.channels.get(channelName);
    if (id === "0") return undefined;

    return await client.channels.fetch(id);
};

guildProfileSchema.methods.setChannel = function (channelName: string, id: string) {
    this.channels.set(channelName, id);
};

//? Permissions

guildProfileSchema.methods.getPermission = function (permissionName: string) {
    return this.permissions.get(permissionName);
};

guildProfileSchema.methods.checkPermissions = function (user: GuildMember, requiredPermissions: string[]) {
    const userRoles = user.roles.cache.map((role) => role.id);

    // Applies for guild owner too as they will always have it
    if (user.permissions.has("Administrator")) return true;

    const permission = this.permissions.get("Administrator");
    if (permission.roles.some((role: string) => userRoles.includes(role)) || permission.users.includes(user.id))
        return true;

    const ownedPermissions: string[] = [];

    for (const permissionName of requiredPermissions) {
        const permission = this.permissions.get(permissionName);

        if (permission.roles.some((role: string) => userRoles.includes(role))) {
            ownedPermissions.push(permissionName);
            continue;
        }

        if (permission.users.includes(user.id)) ownedPermissions.push(permissionName);
    }

    console.log(ownedPermissions);
    console.log(requiredPermissions);

    if (ownedPermissions.length === requiredPermissions.length) return true;

    return false;
};

// Permission/Users

guildProfileSchema.methods.addUserToPermission = function (permissionName: string, userId: string) {
    this.permissions.get(permissionName).users.push(userId);
};

guildProfileSchema.methods.removeUserFromPermission = function (permissionName: string, userId: string) {
    this.permissions.get(permissionName).users = this.permissions
        .get(permissionName)
        .users.filter((user: string) => user !== userId);
};

guildProfileSchema.methods.setUsersToPermission = function (permissionName: string, userIds: string[]) {
    this.permissions.get(permissionName).users = userIds;
};

// Permission/Roles

guildProfileSchema.methods.addRoleToPermission = function (permissionName: string, roleId: string) {
    this.permissions.get(permissionName).roles.push(roleId);
};

guildProfileSchema.methods.removeRoleFromPermission = function (permissionName: string, roleId: string) {
    this.permissions.get(permissionName).roles = this.permissions
        .get(permissionName)
        .roles.filter((role: string) => role !== roleId);
};

guildProfileSchema.methods.setRolesToPermission = function (permissionName: string, roleIds: string[]) {
    this.permissions.get(permissionName).roles = roleIds;
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
        const rbxUser = await client.noblox.getPlayerInfo(Number.parseInt(robloxId));

        return (await this.addUser({ id: robloxId, name: rbxUser.username })).users.get(robloxId);
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
};

//? Point logs

guildProfileSchema.methods.addPointLog = function (logId: string, log: PointLog) {
    this.pointLogs.set(logId, log);
};

guildProfileSchema.methods.getPointLog = function (logId: string) {
    return this.pointLogs.get(logId);
};

guildProfileSchema.methods.removePointLog = function (logId: string) {
    this.pointLogs = new Map([...this.pointLogs].filter(([key, log]: [string, PointLog]) => key !== logId));
};

guildProfileSchema.methods.updatePointLog = function (logId: string, log: PointLog) {
    this.pointLogs.set(logId, log);
};

guildProfileSchema.methods.getPointLogs = function (query?: {
    creatorName?: string;
    creatorId?: string;
    targetName?: string;
    targetId?: string;
}) {
    if (!query) return this.pointLogs;

    const { creatorName, creatorId, targetName, targetId } = query;
    return (
        Array.from(this.pointLogs.values()).filter(
            (log: unknown) =>
                (creatorName ? (log as PointLog).creator.name === creatorName : true) &&
                (creatorId ? (log as PointLog).creator.id === creatorId : true) &&
                (targetName
                    ? (log as PointLog).data.some((data) => data.name === targetName)
                    : targetId
                      ? (log as PointLog).data.some((data) => data.id === targetId)
                      : true),
        ) || []
    );
};

//? Schedule

guildProfileSchema.methods.addScheduledEvent = function (eventId: string, event: ScheduledEvent) {
    this.schedule.events.set(eventId, event);
};

guildProfileSchema.methods.getScheduledEvent = function (eventId: string) {
    return this.schedule.events.get(eventId);
};

guildProfileSchema.methods.removeScheduledEvent = function (eventId: string) {
    this.schedule.events = new Map(
        [...this.schedule.events].filter(([key, event]: [string, ScheduledEvent]) => key !== eventId),
    );
};

guildProfileSchema.methods.updateScheduledEvent = function (eventId: string, event: ScheduledEvent) {
    this.schedule.events.set(eventId, event);
};

guildProfileSchema.methods.getScheduledEvents = function (query?: {
    hostName?: string;
    hostId?: string;
    eventType?: string;
}) {
    if (!query) return this.schedule.events;

    const { hostName, hostId, eventType } = query;
    return (
        Array.from(this.schedule.events.values()).filter(
            (event) =>
                (hostName ? (event as ScheduledEvent).host.name === hostName : true) &&
                (hostId ? (event as ScheduledEvent).host.id === hostId : true) &&
                (eventType ? (event as ScheduledEvent).eventType === eventType : true),
        ) || []
    );
};

//? Schedule Types

guildProfileSchema.methods.addScheduleType = function (name: string, scheduleType: ScheduleEventType) {
    this.schedule.types.set(name, scheduleType);
};

guildProfileSchema.methods.getScheduleType = function (name: string) {
    return this.schedule.types.get(name);
};

guildProfileSchema.methods.removeScheduleType = function (name: string) {
    this.schedule.types = new Map(
        [...this.schedule.types].filter(([key, type]: [string, ScheduleEventType]) => key !== name),
    );
};

guildProfileSchema.methods.updateScheduleType = function (name: string, scheduleType: ScheduleEventType) {
    this.schedule.types.set(name, scheduleType);
};

guildProfileSchema.methods.getScheduleTypes = function () {
    return Array.from(this.schedule.types.values()) || [];
};

//? API

guildProfileSchema.methods.getAPIKey = function (keyName: string) {
    return this.API.keys.get(keyName);
};

guildProfileSchema.methods.addAPIKey = function (name: string, APIkey: APIKey) {
    this.API.keys.set(name, APIkey);
};

guildProfileSchema.methods.removeAPIKey = function (name: string) {
    this.API.keys = new Map([...this.API.keys].filter(([key, value]: [string, APIKey]) => key !== name));
};

guildProfileSchema.methods.updateAPIKey = function (name: string, APIkey: APIKey) {
    this.API.keys.set(name, APIkey);
};

guildProfileSchema.methods.validateAPIKey = function (key: string) {
    return Array.from(this.API.keys.values()).some(
        (apiKey) => (apiKey as APIKey).key === client.Functions.Decrypt(key, this.iv),
    );
};

const guildProfile = mongoose.model<guildProfileInterface>("guildProfile", guildProfileSchema);

export default guildProfile;
export type { guildProfileInterface, guildProfileSchema };
