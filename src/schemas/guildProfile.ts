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
        id: number;
    };

    eventType: string;
    ongoing: boolean;

    discordEventId: string;
    robloxEventId: string;
};

interface guildProfileInterface extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    iv: string;

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

    getFFlag: (FFlagName: string) => unknown;
    setFFlag: (FFlagName: string, value: unknown) => Promise<guildProfileInterface>;

    getSetting: (settingName: string) => unknown;
    setSetting: (settingName: string, value: unknown) => Promise<guildProfileInterface>;

    getPermission: (permissionName: string) => Permission;
    checkPermissions: (user: GuildMember, requiredPermissions: string[]) => boolean;

    addUserToPermission: (permissionName: string, userId: string) => Promise<guildProfileInterface>;
    removeUserFromPermission: (permissionName: string, userId: string) => Promise<guildProfileInterface>;
    setUsersToPermission: (permissionName: string, userIds: string[]) => Promise<guildProfileInterface>;

    addRoleToPermission: (permissionName: string, roleId: string) => Promise<guildProfileInterface>;
    removeRoleFromPermission: (permissionName: string, roleId: string) => Promise<guildProfileInterface>;
    setRolesToPermission: (permissionName: string, roleIds: string[]) => Promise<guildProfileInterface>;

    getChannel: (channelName: string) => Promise<TextChannel>;
    setChannel: (channelName: string, id: string) => Promise<guildProfileInterface>;

    addUser: (robloxUser: { id: string; name: string }) => Promise<guildProfileInterface>;
    getUser: (robloxId: string) => Promise<guildUser>;
    calculatePendingPoints: (robloxId: string) => number;
    setNote: (robloxId: string, note: string, visible?: boolean) => Promise<guildProfileInterface>;
    setRankLock: (
        robloxId: string,
        rank: NumberRange<0, 255>,
        shadow?: boolean,
        reason?: string,
    ) => Promise<guildProfileInterface>;

    addPointLog: (log: PointLog) => Promise<guildProfileInterface>;
    getPointLog: (logId: string) => Promise<PointLog>;
    removePointLog: (logId: string) => Promise<guildProfileInterface>;
    updatePointLog: (logId: string, log: PointLog) => Promise<guildProfileInterface>;
    getPointLogs: (query?: { creatorId: string; targetId: string }) => PointLog[];
}

const guildProfileSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    iv: { type: String, unique: true, required: true },

    guild: {
        id: { type: String, unique: true, required: true },
        name: { type: String, required: true },
    },

    roblox: {
        groupId: { type: Number, required: false, default: undefined },

        places: Map,
    },

    API: {
        rover_Key: { type: String, default: undefined },
        bloxlink_Key: { type: String, default: undefined },

        enabled: { type: Boolean, default: false },
        keys: Map,
    },

    users: Map,

    schedule: {
        types: Map,
        events: Map,
    },

    permissions: Map,
    channels: Map,

    FFlags: Map,
    settings: Map,
});

guildProfileSchema.methods.fetchGuild = async function () {
    return await client.guilds.fetch(this.guild.id);
};

//? FFlags

guildProfileSchema.methods.getFFlag = function (FFlagName: string) {
    return this.FFlags.get(FFlagName);
};

guildProfileSchema.methods.setFFlag = async function (FFlagName: string, value: unknown) {
    this.FFlags.set(FFlagName, value);

    return this.save();
};

//? Settings

guildProfileSchema.methods.getSetting = function (settingName: string) {
    return this.settings.get(settingName);
};

guildProfileSchema.methods.setSetting = async function (settingName: string, value: unknown) {
    this.settings.set(settingName, value);

    return this.save();
};

//? Channels

guildProfileSchema.methods.getChannel = async function (channelName: string) {
    return await client.channels.fetch(this.channels.get(channelName));
};

guildProfileSchema.methods.setChannel = async function (channelName: string, id: string) {
    this.channels.set(channelName, id);

    return this.save();
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

    return this.save();
};

guildProfileSchema.methods.removeUserFromPermission = async function (permissionName: string, userId: string) {
    this.permissions.get(permissionName).users = this.permissions
        .get(permissionName)
        .users.filter((user: string) => user !== userId);

    return this.save();
};

guildProfileSchema.methods.setUsersToPermission = async function (permissionName: string, userIds: string[]) {
    this.permissions.get(permissionName).users = userIds;

    return this.save();
};

// Permission/Roles

guildProfileSchema.methods.addRoleToPermission = async function (permissionName: string, roleId: string) {
    this.permissions.get(permissionName).roles.push(roleId);

    return this.save();
};

guildProfileSchema.methods.removeRoleFromPermission = async function (permissionName: string, roleId: string) {
    this.permissions.get(permissionName).roles = this.permissions
        .get(permissionName)
        .roles.filter((role: string) => role !== roleId);

    return this.save();
};

guildProfileSchema.methods.setRolesToPermission = async function (permissionName: string, roleIds: string[]) {
    this.permissions.get(permissionName).roles = roleIds;

    return this.save();
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
    const user = this.getUser(robloxId);

    user.note.text = note;
    user.note.visible = visible ?? true;
    user.note.updatedAt = new Date();

    return this.save();
};

guildProfileSchema.methods.setRankLock = async function (
    robloxId: string,
    rank: NumberRange<0, 255>,
    shadow?: boolean,
    reason?: string,
) {
    const user = this.getUser(robloxId);

    user.ranklock.rank = rank;
    user.ranklock.shadow = shadow ?? false;
    user.ranklock.reason = reason;
    user.ranklock.updatedAt = new Date();

    return this.save();
};

//? Point logs

guildProfileSchema.methods.addPointLog = async function (log: PointLog) {
    this.pointLogs.push(log);

    return this.save();
};

guildProfileSchema.methods.getPointLog = async function (logId: string) {
    return this.pointLogs.find((log: PointLog) => log.id === logId);
};

guildProfileSchema.methods.removePointLog = async function (logId: string) {
    this.pointLogs = this.pointLogs.filter((log: PointLog) => log.id !== logId);

    return this.save();
};

guildProfileSchema.methods.updatePointLog = async function (logId: string, log: PointLog) {
    this.pointLogs = this.pointLogs.map((log: PointLog) => (log.id === logId ? log : log));

    return this.save();
};

guildProfileSchema.methods.getPointLogs = function (query?: { creatorId?: string; targetId?: string }) {
    if (!query) return this.pointLogs;

    const { creatorId, targetId } = query;
    return (
        this.pointLogs.filter(
            (log: PointLog) =>
                (creatorId ? log.creator.id === creatorId : true) &&
                (targetId ? log.data.some((data) => data.id.toString() === targetId) : true),
        ) || []
    );
};

const guildProfile = mongoose.model<guildProfileInterface>("Guild", guildProfileSchema);

export default guildProfile;
export type { guildProfileInterface, guildProfileSchema };
