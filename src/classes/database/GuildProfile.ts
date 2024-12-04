export type PermissionEntry = {
    users: Array<string>;
    roles: Array<string>;
};

export type rawGuildData = {
    id: number;
    version: number;

    shortname: string;

    permissions: Record<string, PermissionEntry>;
    channels: Record<string, string>;

    settings: Record<string, unknown>;
    fflags: Record<string, unknown>;

    updated_at: Date;
};

export default class GuildProfile {
    readonly rawdata: rawGuildData;

    readonly id: string;
    readonly version: number;

    readonly shortname: string;

    readonly permissions: Record<string, PermissionEntry>;
    readonly channels: Record<string, string>;

    readonly settings: Record<string, unknown>;
    readonly fflags: Record<string, unknown>;

    constructor(rawdata: rawGuildData) {
        this.rawdata = rawdata;

        this.id = rawdata.id.toString();
        this.version = rawdata.version;

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
