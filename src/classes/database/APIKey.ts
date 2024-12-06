export type rawAPIKeyData = {
    _id: number;
    __v: number;

    guild_id: number;

    name: string;
    value: string;
    enabled: boolean;
    permissions: string[];

    created_at: Date;
    created_by: number;
};

export default class APIKey {
    readonly _id: number;
    readonly __v: number;

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
};