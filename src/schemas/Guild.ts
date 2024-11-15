import type { ColorResolvable } from "discord.js";
import mongoose from "mongoose";
import client from "../main.ts";

type guildUser = {
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

type Permission = {
    name: string;
    roles: string[];
    users: string[];
};

type APIKey = {
    name: string;
    key: string;

    enabled: boolean;
    permissions: string[];

    createdAt: Date;
    createdBy: string;
};

type robloxPlace = {
    name: string;
    id: string; // placeId, not UniverseId
    key: string; // API Key
};

type PointLog = {
    id: string;
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

type ScheduleEventType = {
    name: string;
    icon: string;
    color: ColorResolvable;

    description: string;

    useRobloxSchedule: boolean;
    useDiscordSchedule: boolean;

    canSchedule: { roles: string[]; users: string[] };
};

type ScheduledEvent = {
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
    id: string;
};

interface guildInterface extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    iv: string;

    guild: {
        id: string;
        name: string;
    };

    roblox: {
        groupId: number;

        places: Map<string, robloxPlace>;
    };

    API: {
        rover_Key: string | undefined;
        bloxlink_Key: string | undefined;

        enabled: boolean;
        keys: Map<string, APIKey>;
    };

    users: Map<string, guildUser>;
    permissions: Map<string, Permission>;

    FFlags: Map<string, unknown>;
    settings: Map<string, unknown>;
}

const guildSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    iv: String,

    guild: {
        id: String,
        name: String,
    },

    roblox: {
        groupId: Number,

        places: Map,
    },

    API: {
        rover_Key: String,
        bloxlink_Key: String,

        enabled: { type: Boolean, default: false },
        keys: Map,
    },

    users: Map,
    permissions: Map,

    FFlags: Map,
    settings: Map,
});

guildSchema.methods.fetchGuild = async function () {
    return await client.guilds.fetch(this.guild.id);
};

const Guild = mongoose.model<guildInterface>("Guild", guildSchema);

export default Guild;
export type { guildInterface, guildUser, APIKey, PointLog };
