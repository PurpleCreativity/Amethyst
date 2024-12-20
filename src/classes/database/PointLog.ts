import type mariadb from "mariadb";
import client from "../../main.js";

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
    readonly guild_id: string;

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
        this.guild_id = rawdata.guild_id;

        this.note = rawdata.note;
        this.data = rawdata.data || [];

        this.creator = {
            roblox_id: rawdata.creator_roblox_id,
            roblox_username: rawdata.creator_roblox_username,
        };

        this.createdAt = rawdata.created_at ?? new Date();
    }

    async save(): Promise<void> {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await client.Database.getConnection();
            await connection.beginTransaction();

            const result = await connection.query(
                `INSERT INTO point_logs (id, note, data, guild_id, creator_roblox_id, creator_roblox_username, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    note = VALUES(note),
                    data = VALUES(data)`,
                [
                    this.id,
                    this.note,
                    JSON.stringify(this.data),
                    this.guild_id,
                    this.creator.roblox_id,
                    this.creator.roblox_username,
                    this.createdAt,
                ],
            );

            if (result.affectedRows < 0) throw new Error("Failed to save changes.");

            await connection.commit();
            this.__v += 1;
        } catch (error) {
            if (connection) await connection.rollback();

            throw error;
        } finally {
            if (connection) await connection.end();
        }
    }
}
