import client from "../../main.js";

export type rawUserData = {
    _id: number;
    _v: number;

    iv: Buffer;

    discord_id: string;
    discord_username: string;

    roblox_id: number | null;
    roblox_username: string | null;

    settings: Record<string, unknown>;
    fflags: Record<string, unknown>;

    updated_at: Date;
};

export default class UserProfile {
    readonly rawdata: rawUserData;

    readonly _id: number;
    readonly _v: number;

    readonly iv: string;

    readonly discord_id: string;
    readonly discord_username: string;

    readonly roblox_id: number | null;
    readonly roblox_username: string | null;

    readonly settings: Record<string, unknown>;
    readonly fflags: Record<string, unknown>;

    readonly updated_at: Date;

    constructor(rawdata: rawUserData) {
        this.rawdata = rawdata;

        this._id = rawdata._id;
        this._v = rawdata._v;

        this.iv = rawdata.iv.toString("hex");

        this.discord_id = rawdata.discord_id;
        this.discord_username = rawdata.discord_username;

        this.roblox_id = rawdata.roblox_id;
        this.roblox_username = rawdata.roblox_username;

        this.settings = rawdata.settings;
        this.fflags = rawdata.fflags;

        this.updated_at = rawdata.updated_at;
    }

    getSetting = (key: string): unknown => {
        return this.settings[key];
    };

    setSetting = (key: string, value: unknown): void => {
        this.settings[key] = value;
    };

    save = async (): Promise<void> => {};
}
