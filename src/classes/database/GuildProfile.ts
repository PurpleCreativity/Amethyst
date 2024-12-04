export type PermissionEntry = {
    users: Array<string>;
    roles: Array<string>;
};

export type rawGuildData = {
    _id: number;
    __v: number;

    guild_id: number;
    shortname: string;

    permissions: Record<string, PermissionEntry>;
    channels: Record<string, string>;

    settings: Record<string, unknown>;
    fflags: Record<string, unknown>;
};

export default class GuildProfile {
    readonly rawdata: rawGuildData;

    readonly _id: number;
    readonly __v: number;

    readonly guildId: string;
    readonly shortname: string;

    readonly permissions: Record<string, PermissionEntry>;
    readonly channels: Record<string, string>;

    readonly settings: Record<string, unknown>;
    readonly fflags: Record<string, unknown>;

    constructor(rawdata: rawGuildData) {
        this.rawdata = rawdata;

        this._id = rawdata._id;
        this.__v = rawdata.__v;

        this.guildId = rawdata.guild_id.toString();
        this.shortname = rawdata.shortname;

        this.permissions = rawdata.permissions;
        this.channels = rawdata.channels;

        this.settings = rawdata.settings;
        this.fflags = rawdata.fflags;
    }

    getSetting = (key: string): unknown => {
        return this.settings[key];
    };

    setSetting = (key: string, value: unknown): void => {
        this.settings[key] = value;
    };

    getFFlag = (key: string): unknown => {
        return this.fflags[key];
    };

    setFFlag = (key: string, value: unknown): void => {
        this.fflags[key] = value;
    };
}
