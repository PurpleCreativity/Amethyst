import type { ColorResolvable, Guild, TextChannel } from "discord.js";
import mongoose from "mongoose";
import client from "../main.js";

export type guildUser = {
    user: {
        name: string;
        id: string;
    };

    points: number;

    note: {
        text: string;
        visible: boolean;

        updatedAt: Date;
    };

    ranklock: {
        rank: number;
        shadow: boolean;
        reason: string;

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
    permissions: string[];

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
        id: number;
    };

    data: {
        name: string;
        id: number;

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

    addUserToPermission: (permissionName: string, userId: string) => Promise<guildProfileInterface>;
    removeUserFromPermission: (permissionName: string, userId: string) => Promise<guildProfileInterface>;
    setUsersToPermission: (permissionName: string, userIds: string[]) => Promise<guildProfileInterface>;

    addRoleToPermission: (permissionName: string, roleId: string) => Promise<guildProfileInterface>;
    removeRoleFromPermission: (permissionName: string, roleId: string) => Promise<guildProfileInterface>;
    setRolesToPermission: (permissionName: string, roleIds: string[]) => Promise<guildProfileInterface>;

    getChannel: (channelName: string) => Promise<TextChannel>;
    setChannel: (channelName: string, id: string) => Promise<guildProfileInterface>;
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

const guildProfile = mongoose.model<guildProfileInterface>("Guild", guildProfileSchema);

export default guildProfile;
export type { guildProfileInterface, guildProfileSchema };
