import type mariadb from "mariadb";
import client from "../../main.js";

export type pointlogDataEntry = {
    user: {
        robloxId: number;
        robloxUsername: string;
    };
    points: number;
};

export type rawPointLogData = {
    id: `${string}-${string}-${string}-${string}-${string}`;
    __v: number;
    guildId: string;

    data: pointlogDataEntry[];
    note: string | null;

    creatorRobloxId: number;
    creatorRobloxUsername: string;
    createdAt: Date;
};

export default class PointLog {
    readonly id: string;
    private __v: number;
    readonly guildId: string;

    data: pointlogDataEntry[];
    note: string | null;

    readonly creator: {
        robloxId: number;
        robloxUsername: string;
    };

    readonly createdAt: Date;

    constructor(rawdata: rawPointLogData) {
        this.id = rawdata.id;
        this.__v = rawdata.__v;
        this.guildId = rawdata.guildId;

        this.note = rawdata.note;
        this.data = rawdata.data || [];

        this.creator = {
            robloxId: rawdata.creatorRobloxId,
            robloxUsername: rawdata.creatorRobloxUsername,
        };

        this.createdAt = rawdata.createdAt;
    }

    async save(): Promise<void> {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await client.Database.getConnection();
            await connection.beginTransaction();

            const updateResult = await connection.query(
                `UPDATE PointLogs
                 SET 
                     note = ?,
                     data = ?
                 WHERE id = ? AND __v = ?`,
                [
                    this.note,
                    JSON.stringify(this.data),

                    this.id,
                    this.__v,
                ],
            );

            if (updateResult.affectedRows === 0) {
                const insertResult = await connection.query(
                    `INSERT INTO PointLogs (id, note, data, guildId, creatorRobloxId, creatorRobloxUsername, createdAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        this.id,
                        this.note,
                        JSON.stringify(this.data),
                        this.guildId,
                        this.creator.robloxId,
                        this.creator.robloxUsername,
                        this.createdAt,
                    ],
                );

                if (insertResult.affectedRows === 0) throw new Error("Failed to save changes.");
            }

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
