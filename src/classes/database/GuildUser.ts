import type mariadb from "mariadb";
import client from "../../main.js";
import PointLog, { type rawPointLogData } from "./PointLog.js";

export type ranklockData = {
    rank: number;
    reason: string | null;
    shadow: boolean;
};

export type noteData = {
    creatorId: string;
    content: string;
    createdAt: Date;

    id: `${string}-${string}-${string}-${string}-${string}`;
};

export type rawGuildUserData = {
    id: number;
    __v: number;

    guildId: string;
    robloxId: number;

    points: number;

    notes: noteData[];
    ranklock: ranklockData;
};

export default class GuildUser {
    readonly id: number;
    private __v: number;

    readonly guildId: string;
    robloxId: number;

    points: number;

    notes: noteData[];
    ranklock: ranklockData;

    constructor(rawdata: rawGuildUserData) {
        this.id = rawdata.id;
        this.__v = rawdata.__v;

        this.guildId = rawdata.guildId;
        this.robloxId = rawdata.robloxId;

        this.points = rawdata.points;

        this.notes = rawdata.notes;
        this.ranklock = rawdata.ranklock;
    }

    getNote(noteId: string): noteData | undefined {
        return this.notes.find((data) => data.id === noteId);
    }

    removeNote(noteId: string) {
        this.notes = this.notes.filter((data) => data.id !== noteId);
    }

    addNote(creatorId: string, content: string): `${string}-${string}-${string}-${string}-${string}` {
        const id = client.Functions.GenerateUUID();

        this.notes.push({
            creatorId: creatorId,

            content: content,
            createdAt: new Date(),

            id: id,
        });

        return id;
    }

    getNotes(query: Partial<noteData>): noteData[] {
        return this.notes.filter((note) =>
            Object.entries(query).every(([key, value]) => note[key as keyof noteData] === value),
        );
    }

    async fetchPendingPoints(): Promise<number> {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await client.Database.getConnection();
            const result = await connection.query<{ pendingPoints: string }[]>(
                `
                SELECT SUM(jt.points) AS pendingPoints
                FROM PointLogs,
                JSON_TABLE(
                    data, '$[*]'
                    COLUMNS (
                        points INT PATH '$.points',
                        robloxId BIGINT PATH '$.user.robloxId'
                    )
                ) AS jt
                WHERE jt.robloxId = ?
                `,
                [this.robloxId],
            );

            return result[0]?.pendingPoints ? Number.parseInt(result[0]?.pendingPoints) : 0;
        } finally {
            if (connection) await connection.end();
        }
    }

    async save(): Promise<void> {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await client.Database.getConnection();
            await connection.beginTransaction();

            const result = await connection.query(
                `
                INSERT INTO GuildUsers (guildId, robloxId, points, notes, ranklock)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    points = VALUES(points),
                    notes = VALUES(notes),
                    ranklock = VALUES(ranklock)
                `,
                [
                    this.guildId,
                    this.robloxId,
                    Math.floor(this.points),
                    JSON.stringify(this.notes),
                    JSON.stringify(this.ranklock),
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
