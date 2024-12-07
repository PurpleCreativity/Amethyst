export type rawAPIKeyData = {
    _id: bigint;
    __v: bigint;

    guild_id: number;

    name: string;
    value: string;
    enabled: boolean;
    permissions: string[];

    created_at: Date;
    created_by: number;
};

export default class APIKey {
    readonly _id: bigint;
    readonly __v: bigint;

    readonly guildId: string;

    name: string;
    value: string;
    enabled: boolean;
    permissions: string[];

    createdAt: Date;
    createdBy: string;

    constructor(rawdata: rawAPIKeyData) {
        this._id = rawdata._id;
        this.__v = rawdata.__v;

        this.guildId = rawdata.guild_id.toString();

        this.name = rawdata.name;
        this.value = rawdata.value;
        this.enabled = rawdata.enabled;
        this.permissions = rawdata.permissions;

        this.createdAt = rawdata.created_at;
        this.createdBy = rawdata.created_by.toString();
    }
}
