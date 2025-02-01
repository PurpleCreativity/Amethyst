import bcrypt from "bcrypt";
import type mariadb from "mariadb";
import client from "../../main.js";
import type { RoutePermission } from "../../types/core/API.js";

export type rawAPIKeyData = {
    id: bigint;
    __v: number;

    guildId: string;

    name: string;
    value: string;
    enabled: boolean;
    permissions: RoutePermission[];

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
    permissions: RoutePermission[];

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

    static async create(
        guildId: string,
        name: string,
        permissions: RoutePermission[],
        createdBy: string,
    ): Promise<{ apiKey: string }> {
        const apiKey = client.API.generateKey();
        const hashedValue = await bcrypt.hash(apiKey, 10);

        let connection: mariadb.Connection | undefined;
        try {
            connection = await client.Database.getConnection();

            await connection.query(
                `INSERT INTO APIKeys (guildId, name, value, permissions, createdBy)
                     VALUES (?, ?, ?, ?, ?)`,
                [guildId, name, hashedValue, JSON.stringify(permissions), createdBy],
            );

            return { apiKey };
        } finally {
            if (connection) await connection.end();
        }
    }
}
