export type rawDataEntry = {
    roblox_id: number;
    roblox_username: string;
    points: number;
};

export type rawPointLogData = {
    id: string;
    _v: bigint;

    guild_id: number;

    data?: rawDataEntry[];
    note: string | null;

    creator_roblox_id: number;
    creator_roblox_username: string;
    created_at: Date;
};

export type dataEntry = {
    roblox: {
        id: number;
        username: string;
    };
    points: number;
};

export default class PointLog {
    readonly id: string;
    _v: bigint;

    readonly guildId: string;

    readonly data: dataEntry[];
    note: string | null;

    readonly creator: {
        roblox_id: number;
        roblox_username: string;
    };

    createdAt: Date;

    constructor(rawdata: rawPointLogData) {
        this.id = rawdata.id;
        this._v = rawdata._v;

        this.id = rawdata.id;
        this.guildId = rawdata.guild_id.toString();

        this.data =
            rawdata.data?.map((data: rawDataEntry) => ({
                roblox: { id: data.roblox_id, username: data.roblox_username },
                points: data.points,
            })) || [];
        this.note = rawdata.note;

        this.creator = {
            roblox_id: rawdata.creator_roblox_id,
            roblox_username: rawdata.creator_roblox_username,
        };

        this.createdAt = rawdata.created_at || new Date();
    }
}
