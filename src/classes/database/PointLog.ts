export type dataEntry = {
    roblox_id: number;
    roblox_username: string;
    points: number;
};

export type rawPointLogData = {
    _id: bigint;
    __v: bigint;

    id: string;
    guild_id: number;

    data?: dataEntry[];
    note: string | null;

    creator_roblox_id: number;
    creator_roblox_username: string;
    created_at: Date;
};

export default class PointLog {
    readonly _id: bigint;
    __v: bigint;

    readonly id: string;
    readonly guildId: string;

    readonly data: dataEntry[];
    note: string | null;

    readonly creator: {
        roblox_id: number;
        roblox_username: string;
    };

    createdAt: Date;

    constructor(rawdata: rawPointLogData) {
        this._id = rawdata._id;
        this.__v = rawdata.__v;

        this.id = rawdata.id;
        this.guildId = rawdata.guild_id.toString();

        this.data = rawdata.data || [];
        this.note = rawdata.note;

        this.creator = {
            roblox_id: rawdata.creator_roblox_id,
            roblox_username: rawdata.creator_roblox_username,
        };

        this.createdAt = rawdata.created_at || new Date();
    }
}
