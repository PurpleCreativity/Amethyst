import mongoose from "mongoose";
import client from "../index.js";
import type { Group, User } from "wrapblox";
import type { Guild, GuildMember } from "discord.js";
import type { customPermissionOptions } from "../classes/SlashCommand.js";

type guildUser = {
    roblox: {
        username: string,
        id: number,
    }

    discord: {
        username: string,
        id: string,
    }

    points: number,

    note: {
        text: string,
        visible: boolean,

        updatedAt: Date,
    },

    ranklock: {
        rank: number,
        shadow: boolean,
        reason: string,

        updatedAt: Date,
    }
}

type Flag = {
    name: string,
    value: any,
}

type APIKey = {
    name : string,
    key : string,

    enabled : boolean,
    permissions : string[],

    createdAt : Date,
    createdBy : number,
}

type customPermission = {
    name: string,
    roles: string[],
    users: string[],
}

type customChannel = {
    id: string,
    name: string,
}

type Bind = {
    name: string,
    roles: string[],
    bind: string,
	enabled: boolean,
}

type trackedRobloxGroup = {
    groupId: number,
    channelId: string,
	tracked: {
        ranks: number[],
        types: string[],
    }
}

type linkedGuild  = {
    shortname: string,
    id: string,
    _documentId: string,

    settings: Map<string, Setting>,
}

type Setting = {
    name: string,
    description: string,
    value: any,
}

type Module = {
    name: string,
    description: string,
    enabled: boolean,
}

type RobloxPlace = {
    name: string,
    id: string,
    key: string
}

type PointLog = {
	id : string,
    creator : {
        username : string,
        id: number,
    },

	data : {
		username : string,
        id: number,
        
		points : number,
	}[]
	notes : string | undefined,

    createdAt: Date,
};

type ScheduleEventType = {
    name : string,
    icon : string,
    color : string,

    description : string,

    canSchedule : { roles : string[], users : string[] },
}

type ScheduledEvent = {
	time : number;
	duration : number;
	notes? : string;
	host: {
        username: string,
        id: number,
    },

    event: string;
    ongoing : boolean;

    discordEventId: string;
    robloxEventId: string;
	id : string;
}

interface guildProfileInterface extends mongoose.Document {
	_id: mongoose.Types.ObjectId,
    iv: string,

    guild: {
        id: string,
        shortname: string,

        channels: Map<string, customChannel>,
        customPermissions: Map<string, customPermission>,
    },

    modules: Map<string, Module>,
    binds: Map<string, Bind>,

    users: Map<string, guildUser>,
    pointlogs: Map<string, PointLog>,
    flags: Map<string, Flag>,

    schedule: {
        scheduled: Map<string, ScheduledEvent>,
        types: Map<string, ScheduleEventType>,
    }

    API: {
        keys: Map<string, APIKey>,

        enabled: boolean,
        banned: boolean,
    },

    roblox: {
        groupId: number,

        rover_Key: string,
        bloxlink_Key: string,

        trackedGroups: Map<string, trackedRobloxGroup>,
        places: Map<string, RobloxPlace>,
    },

    settings: Map<string, Setting>,

    linkedGuilds: Map<string, linkedGuild>

    //? Methods

    fetchGuild: () => Promise<Guild>,
    fetchOwner: () => Promise<GuildMember>,
    customPermissionCheck: (guildMember: GuildMember, customPermissions: customPermissionOptions[]) => Promise<boolean>,

    getUser: (searcher: string | number) => Promise<guildUser>,
    addUser: (robloxUser: User) => Promise<guildUser>,

    setNotes: (robloxId: number, noteData: { text: string, visible: boolean }, modifier?: number | User) => Promise<void>,

    calculateUserPendingPoints: (robloxId: number) => Promise<number>,
    setPoints: (robloxId: number, points: number) => Promise<void>,
    incrementPoints: (robloxId: number, points: number, modifier?: number | User) => Promise<void>,

    getModule: (name: string) => Promise<Module | undefined>,
    addModule: (module: Module) => Promise<void>,

    getChannel: (type: string) => Promise<customChannel>,
    setChannel: (data: customChannel) => Promise<void>,

    getAllPointLogs: () => Promise<PointLog[]>,
    addPointLog: (pointLog: PointLog) => Promise<void>,
    getPointLog: (id: string) => Promise<PointLog | undefined>,
    removePointLog: (id: string) => Promise<void>,
    editPointLog: (id: string, newData: PointLog) => Promise<void>,
    importPointLog: (id: string) => Promise<void>,

    linkGroup: (groupID: number) => Promise<void>,
    fetchGroup: () => Promise<Group | undefined>,
}

const guildProfileSchema = new mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    iv : String,

    guild : {
        id : String,
        shortname : String,

        channels : {
            type : Map,
            of : {
                id : String,
                name : String,
            }
        },
        customPermissions : {
            type : Map,
            of : {
                name : String,
                roles : [String],
                users : [String],
            }
        },
    },

    modules : {
        type : Map,
        of : {
            name : String,
            description : String,
            enabled : Boolean,
        }
    },

    binds: {
        type : Map,
        of : {
            name: String,
            roles: [String],
            bind: String,
            enabled: Boolean,
        }
    },

    users : {
        type : Map,
        of : {
            roblox : {
                username : String,
                id : Number,
            },

            discord: {
                username: String,
                id: String,
            },

            points : Number,

            note : {
                text : String,
                visible : Boolean,

                updatedAt : Date,
            },

            ranklock : {
                rank : Number,
                shadow : Boolean,
                reason : String,

                updatedAt : Date,
            }
        }
    },

    flags : {
        type : Map,
        of : {
            name : String,
            value: mongoose.Schema.Types.Mixed,
        }
    },

    pointlogs : {
        type : Map,
        of : {
            id : String,
            creator : {
                username : String,
                id: Number,
            },

            data : [{
                username : String,
                id: Number,
                points : Number,
            }],
            notes : String,

            createdAt : Date,
        }
    },

    schedule : {
        scheduled : {
            type : Map,
            of : {
                time : Number,
                duration : Number,
                notes : String,
                host: {
                    username: String,
                    id: Number,
                },

                event : String,
                ongoing : Boolean,

                discordEventId: String,
                robloxEventId: String,
                id : String,
            }
        },
        types : {
            type : Map,
            of : {
                name : String,
                icon : String,
                color : String,

                description : String,

                canSchedule : {
                    roles : [String],
                    users : [String],
                }
            }
        },
    },

    API : {
        keys : {
            type : Map,
            of : {
                name : String,
                key : String,

                enabled : Boolean,
                permissions : [String],

                createdAt : Date,
                createdBy : Number,
            }
        },

        enabled : Boolean,
        banned : Boolean,
    },

    roblox : {
        groupId : Number,

        rover_Key : String,
        bloxlink_Key : String,

        trackedGroups: {
            type : Map,
            of : {
                groupId: Number,
                channelId: String,
                tracked: {
                    ranks: [Number],
                    types: [String],
                }
            }
        },

        places : {
            type : Map,
            of : {
                name : String,
                id : String,
                key : String,
            }
        },
    },

    settings : {
        type : Map,
        of : {
            name : String,
            description : String,
            value : mongoose.Schema.Types.Mixed,
        }
    },

    linkedGuilds : {
        type : Map,
        of : {
            shortname : String,
            id : String,
            _documentId : mongoose.Types.ObjectId,

            settings : {
                type : Map,
                of : {
                    name : String,
                    description : String,
                    value : mongoose.Schema.Types.Mixed,
                }
            }
        }
    }
});

//? Methods

guildProfileSchema.methods.fetchGuild = async function () {
    return await client.Functions.GetGuild(this.guild.id);
}

guildProfileSchema.methods.fetchOwner = async function () {
    const guild = await this.fetchGuild();
    const owner = await guild.fetchOwner().then((owner:any) => owner.user);

    return owner;
}

guildProfileSchema.methods.customPermissionCheck = async function (guildMember: GuildMember, customPermissions: customPermissionOptions[]) {
    if (customPermissions.length === 0) return true;

    const roles = guildMember.roles.cache.map((role) => role.id);
    const ownedPermissions = [] as customPermissionOptions[];

    const adminPermission = this.guild.customPermissions.get("Administrator")
    if (adminPermission) {
        if (adminPermission.users.includes(guildMember.id)) return true;

        for (const roleId of roles) {
            if (adminPermission.roles.includes(roleId)) return true;
        }
    }

    for (const permissionName of customPermissions) {
        const permission = this.guild.customPermissions.get(permissionName)
		if (!permission) continue;

        if (permission.users.includes(guildMember.id)) {ownedPermissions.push(permission.name); continue;};

		for (const roleId of roles) {
			if (permission.roles.includes(roleId)) {ownedPermissions.push(permission.name); continue;};
		}
    }

    if (customPermissions.every(permission => ownedPermissions.includes(permission))) return true;

    return false;
}

// Users
guildProfileSchema.methods.getUser = async function (searcher: string | number) {
    const id = Number.parseInt(searcher as string);
    if (!id) {
        for (const user of this.users.values()) {
            if (user.robloxUsername.toLowerCase() === (searcher as string).toLowerCase()) {
                return user;
            }
        }
        return this.addUser(await client.WrapBlox.fetchUserByName(searcher as string));
    }

    if (this.users.has(id.toString())) {
        return this.users.get(id.toString());
    }

    return this.addUser(await client.WrapBlox.fetchUser(id));
}

guildProfileSchema.methods.addUser = async function (robloxUser: User) {
    this.users.set(robloxUser.id.toString(), {
        roblox: {
            username: robloxUser.name,
            id: robloxUser.id,
        },

        points: 0,

        note: {
            text: "",
            visible: false,

            updatedAt: new Date(),
        },

        ranklock: {
            rank: 0,
            shadow: false,
            reason: "",

            updatedAt: new Date(),
        }
    });

    await this.save();

    return this.getUser(robloxUser.id);
}

// Points
guildProfileSchema.methods.calculateUserPendingPoints = async function (robloxId: number) {
    const robloxUser = await client.Functions.GetRobloxUser(robloxId);
    if (!robloxUser) return 0;

    const pointlogs = await this.getAllPointLogs();
    let pendingPoints = 0;

    for (const log of pointlogs) {
        const entry = log.data.find((entry: { username: string, points: number }) => entry.username.toLowerCase() === robloxUser.name.toLowerCase());
        if (!entry) continue;

        pendingPoints += entry.points;
    }

    return pendingPoints;
}

guildProfileSchema.methods.setNotes = async function (robloxId: number, noteData: { text: string, visible: boolean }, modifier?: number | User) {
    const user = await this.getUser(robloxId);
    if (!user) throw new Error("User not found");

    const oldData = user.note;
    user.note = noteData;
    user.note.updatedAt = new Date();
    await this.save();

    let actualModifier: User | undefined;
    if (typeof modifier === "number") actualModifier = await this.client.Functions.GetRobloxUser(modifier); else actualModifier = modifier;
    if (!actualModifier) return;

    const channel = await this.getChannel("PointsDatabaseUpdates");
    if (!channel) return;

    const targetUser = await client.Functions.GetRobloxUser(robloxId);
    if (!targetUser) return;

    await channel.send({ embeds: [
        client.Functions.makeInfoEmbed({
            title: "Notes Updated",
            description: `[${actualModifier.name}](https://www.roblox.com/users/${actualModifier.id}/profile) **updated** the notes for [${targetUser.name}](https://www.roblox.com/users/${targetUser.id}/profile)`,
            thumbnail: await targetUser.fetchUserHeadshotUrl(),
            footer: { text: actualModifier.name, iconURL: await actualModifier.fetchUserHeadshotUrl() },
            fields: [
                { name: "Old Data", value: `${oldData.text !== "" ? `Visible: \`${oldData.visible}\`\n Note: ${oldData.text}` : "No notes"}`, inline: false },
                { name: "New Data", value: `${noteData.text !== "" ? `Visible: \`${noteData.visible}\`\n Note: ${noteData.text}` : "No notes"}`, inline: false }
            ]
        })
    ] })
}

guildProfileSchema.methods.setPoints = async function (robloxId: number, newAmount: number) {
    const user = await this.getUser(robloxId);
    if (!user) throw new Error("User not found");

    user.points = newAmount;
    await this.save();
}

guildProfileSchema.methods.incrementPoints = async function (robloxId: number, amount: number, modifier?: number | User) {
    const user = await this.getUser(robloxId);
    if (!user) throw new Error("User not found");
    const oldPoints = user.points;

    user.points += amount;
    await this.save();

    let actualModifier: User | undefined;
    if (typeof modifier === "number") actualModifier = await this.client.Functions.GetRobloxUser(modifier); else actualModifier = modifier;
    if (!actualModifier) return;

    const channel = await this.getChannel("PointsDatabaseUpdates");
    if (!channel) return;

    const targetUser = await client.Functions.GetRobloxUser(robloxId);
    if (!targetUser) return;

    await channel.send({ embeds: [
        client.Functions.makeInfoEmbed({
            title: "Points Incremented",
            description: `[${actualModifier.name}](https://www.roblox.com/users/${actualModifier.id}/profile) **added** \`${amount}\` points to [${targetUser.name}](https://www.roblox.com/users/${targetUser.id}/profile)`,
            thumbnail: await targetUser.fetchUserHeadshotUrl(),
            footer: { text: actualModifier.name, iconURL: await actualModifier.fetchUserHeadshotUrl() },
            fields: [
                { name: "Old Points", value: `\`${oldPoints}\``, inline: true },
                { name: "New Points", value: `\`${oldPoints + amount}\``, inline: true },
            ]
        })
    ] });
}
// Channels
guildProfileSchema.methods.getChannel = async function (type: string) {
    const channel = this.guild.channels.get(type);
    if (!channel) throw new Error("Channel not found");

    if (channel.id === "0") return undefined;

    const actualChannel = await client.Functions.GetChannel(channel.id, this.guild.id);
    return actualChannel;
}

guildProfileSchema.methods.setChannel = async function (data: customChannel) {
    this.guild.channels.set(data.name, data);
    await this.save();
}

// Modules
guildProfileSchema.methods.getModule = async function (name: string) {
    return this.modules.get(name);
}

guildProfileSchema.methods.addModule = async function (module: Module) {
    this.modules.set(module.name, module);
    await this.save();
}

// Pointlogs
guildProfileSchema.methods.getAllPointLogs = async function () {
    const pointlogs = [] as PointLog[];

    for (const pointlog of this.pointlogs.values()) {
        pointlogs.push(pointlog);
    }

    pointlogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return pointlogs;
}

guildProfileSchema.methods.addPointLog = async function (pointLog: PointLog) {
    this.pointlogs.set(pointLog.id, pointLog);
    await this.save();
}

guildProfileSchema.methods.getPointLog = async function (id: string) {
    return this.pointlogs.get(id);
}

guildProfileSchema.methods.removePointLog = async function (id: string) {
    this.pointlogs.delete(id);
    await this.save();
}

guildProfileSchema.methods.importPointLog = async function (id: string) {
    const pointLog = await this.getPointLog(id);
    if (!pointLog) throw new Error("Point log not found");

    for (const data of pointLog.data) {
        const user = await this.getUser(data.id);
        user.points += data.points;
    }

    await this.removePointLog(id);
    await this.save();
}

guildProfileSchema.methods.editPointLog = async function (id: string, newData: PointLog) {
    const pointLog = await this.getPointLog(id);
    if (!pointLog) throw new Error("Point log not found");

    this.pointlogs.delete(id);
    this.pointlogs.set(pointLog.id, pointLog);
    await this.save();
}

guildProfileSchema.methods.denyPointLog = async function (id: string) {
    const pointLog = await this.getPointLog(id);
    if (!pointLog) throw new Error("Point log not found");

    await this.removePointLog(id);
    await this.save();
}

// Roblox
guildProfileSchema.methods.linkGroup = async function (groupID:number) {
    this.roblox.group = groupID;
    await this.save();
}

guildProfileSchema.methods.fetchGroup = async function () {
    try {
        return await client.WrapBlox.fetchGroup(this.roblox.groupId);
    } catch (error) {
        return undefined;
    }
}

const guildProfile = mongoose.model("guildProfile", guildProfileSchema);

export default guildProfile;
export type { guildProfileInterface, guildUser, APIKey, PointLog, ScheduleEventType, ScheduledEvent, RobloxPlace, customChannel, customPermission, linkedGuild, Setting, Module };