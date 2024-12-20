export type rawAPIKeyData = {
    id: bigint;
    __v: number;

    guildId: string;

    name: string;
    value: string;
    enabled: boolean;
    permissions: string[];

    createdAt: Date;
    createdBy: string;
};

export default class APIKey {
    readonly id: bigint;
    private __v: number;

    readonly guildId: string;

    name: string;
    value: string;
    enabled: boolean;
    permissions: string[];

    createdAt: Date;
    createdBy: string;

    constructor(rawdata: rawAPIKeyData) {
        this.id = rawdata.id;
        this.__v = rawdata.__v;

        this.guildId = rawdata.guildId;

        this.name = rawdata.name;
        this.value = rawdata.value;
        this.enabled = rawdata.enabled;
        this.permissions = rawdata.permissions;

        this.createdAt = rawdata.createdAt;
        this.createdBy = rawdata.createdBy;
    }
}
