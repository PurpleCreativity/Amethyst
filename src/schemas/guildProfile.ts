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
    description: string,
    enabled: boolean,
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
    type: string,
}

type linkedGuild  = {
    shortname: string,
    id: string,
    _documentId: mongoose.Types.ObjectId,

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
    creator : string,

	data : {
		username : string,
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
	host : string;

    event: string;
    ongoing : boolean;
	id : string;
}

interface guildProfileInterface extends mongoose.Document {
	_id: mongoose.Types.ObjectId,
    iv: string,

    guild: {
        id: number,
        shortname: string,

        channels: Map<string, customChannel>,
        customPermissions: Map<string, customPermission>,
    },

    modules: Map<string, Module>,

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
        group: number,

        rover_Key: string,
        bloxlink_Key: string,

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

    getModule: (name: string) => Promise<Module | undefined>,
    addModule: (module: Module) => Promise<void>,

    getChannel: (type: string) => Promise<customChannel>,
    setChannel: (data: customChannel) => Promise<void>,

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
        id : Number,
        shortname : String,

        channels : {
            type : Map,
            of : {
                id : String,
                type : String,
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

    users : {
        type : Map,
        of : {
            roblox : {
                username : String,
                id : Number,
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
            description : String,
            enabled : Boolean,
        }
    },

    pointlogs : {
        type : Map,
        of : {
            id : String,
            creator : String,

            data : [{
                username : String,
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
                host : String,

                event : String,
                ongoing : Boolean,
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
        group : Number,

        rover_Key : String,
        bloxlink_Key : String,

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

// Channels
guildProfileSchema.methods.getChannel = async function (type: string) {
    const channel = this.guild.channels.get(type);
    if (!channel) throw new Error("Channel not found");

    const actualChannel = await client.Functions.GetChannel(channel.id, this.guild.id);
    return actualChannel;
}

guildProfileSchema.methods.setChannel = async function (data: customChannel) {
    this.guild.channels.set(data.type, data);
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
        const user = await this.getUser(data.username);
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
    return await client.WrapBlox.fetchGroup(this.roblox.group);
}

const guildProfile = mongoose.model("guildProfile", guildProfileSchema);

export default guildProfile;
export type { guildProfileInterface, guildUser, APIKey, PointLog, ScheduleEventType, ScheduledEvent, RobloxPlace, customChannel, customPermission, linkedGuild, Setting, Module };