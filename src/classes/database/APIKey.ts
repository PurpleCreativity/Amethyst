export type rawAPIKeyData = {
    id: bigint;
    __v: number;

    guild_id: string;

    name: string;
    value: string;
    enabled: boolean;
    permissions: string[];

    created_at: Date;
    created_by: number;
};

export default class APIKey {
    readonly id: bigint;
    private __v: number;

    readonly guild_id: string;

    name: string;
    value: string;
    enabled: boolean;
    permissions: string[];

    createdAt: Date;
    createdBy: string;

    constructor(rawdata: rawAPIKeyData) {
        this.id = rawdata.id;
        this.__v = rawdata.__v;

        this.guild_id = rawdata.guild_id;

        this.name = rawdata.name;
        this.value = rawdata.value;
        this.enabled = rawdata.enabled;
        this.permissions = rawdata.permissions;

        this.createdAt = rawdata.created_at;
        this.createdBy = rawdata.created_by.toString();
    }
}
