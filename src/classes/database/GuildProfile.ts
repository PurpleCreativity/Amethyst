export type PermissionEntry = {
    users: Array<string>;
    roles: Array<string>;
};

export type rawGuildData = {
    _id: number,
    _iv: Buffer,
    
    shortname: string;

    guild_id: string;
    guild_name: string;

    permissions: Record<string, PermissionEntry>;
    channels: Record<string, string>;

    settings: Record<string, unknown>;
    fflags: Record<string, unknown>;

    updated_at: Date;
};

export default class GuildProfile {
    readonly rawdata: rawGuildData;

    readonly _id: number;    
    readonly _iv: string;

    readonly guild: { id: string, name: string };
    readonly shortname: string;

    readonly permissions: Record<string, PermissionEntry>;;
    readonly channels: Record<string, string>;

    readonly settings: Record<string, unknown>;
    readonly fflags: Record<string, unknown>;

    readonly updated_at: Date;

    constructor(rawdata: rawGuildData) {
        this.rawdata = rawdata;

        this._id = rawdata._id;
        this._iv = rawdata._iv.toString("hex");

        this.guild = { id: this.rawdata.guild_id, name: this.rawdata.guild_name };
        this.shortname = rawdata.shortname;

        this.permissions = rawdata.permissions;
        this.channels = rawdata.channels;

        this.settings = rawdata.settings;
        this.fflags = rawdata.fflags;

        this.updated_at = rawdata.updated_at;
    };

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
};