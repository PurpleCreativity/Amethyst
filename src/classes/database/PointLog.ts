export type pointlogDataEntry = {
    user: {
        roblox_id: number;
        roblox_username: string;
    };
    points: number;
};

export type rawPointLogData = {
    id: `${string}-${string}-${string}-${string}-${string}`;
    __v: number;

    guild_id: string;

    data: pointlogDataEntry[];
    note: string | null;

    creator_roblox_id: number;
    creator_roblox_username: string;
    created_at: Date;
};

export default class PointLog {
    readonly id: string;
    private __v: number;

    readonly guildId: string;

    data: pointlogDataEntry[];
    note: string | null;

    readonly creator: {
        roblox_id: number;
        roblox_username: string;
    };

    createdAt: Date;

    constructor(rawdata: rawPointLogData) {
        this.id = rawdata.id;
        this.__v = rawdata.__v;

        this.guildId = rawdata.guild_id.toString();
        this.note = rawdata.note;

        this.data = rawdata.data || [];

        this.creator = {
            roblox_id: rawdata.creator_roblox_id,
            roblox_username: rawdata.creator_roblox_username,
        };

        this.createdAt = rawdata.created_at ?? new Date();
    }
}
