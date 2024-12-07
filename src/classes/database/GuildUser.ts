import type { GuildMember, User } from "discord.js";
import type mariadb from "mariadb";
import client from "../../main.js";

export type ranklockData = {
    rank: number;
    reason: string | null;
    shadow: boolean;
};

export type rawNoteData = {
    creator_discord_id: number;
    creator_discord_username: string;
    content: string;
    created_at: string; // Date-string

    id: string;
};

export type noteData = {
    creator: {
        id: string;
        username: string;
    };
    content: string;
    createdAt: Date;

    id: string;
};

export type rawGuildUserData = {
    _id: bigint;
    __v: bigint;

    guild_id: number;
    roblox_id: number;

    points: number;

    notes: rawNoteData[];
    ranklock: ranklockData;
};

export default class GuildUser {
    readonly _id: bigint;
    __v: bigint;

    readonly guildId: string;
    readonly robloxId: number;

    points: number;

    notes: noteData[];
    ranklock: ranklockData;

    constructor(rawdata: rawGuildUserData) {
        this._id = rawdata._id;
        this.__v = rawdata.__v;

        this.guildId = rawdata.guild_id.toString();
        this.robloxId = rawdata.roblox_id;

        this.points = rawdata.points;

        this.notes = rawdata.notes.map((note: rawNoteData) => ({
            creator: {
                id: note.creator_discord_id.toString(),
                username: note.creator_discord_username,
            },
            content: note.content,
            createdAt: new Date(note.created_at),
            id: note.id,
        }));
        this.ranklock = rawdata.ranklock;
    }

    getNote = (noteId: string): noteData | undefined => {
        return this.notes.find((data) => data.id === noteId);
    };

    removeNote = (noteId: string) => {
        this.notes = this.notes.filter((data) => data.id !== noteId);
    };
    addNote = (creator: User, content: string): string => {
        const id = client.Functions.GenerateUUID();

        this.notes.push({
            creator: {
                id: creator.id,
                username: creator.username,
            },

            content: content,
            createdAt: new Date(),

            id: id,
        });

        return id;
    };

    getNotes = (query: Partial<noteData>): noteData[] => {
        return this.notes.filter((note) =>
            Object.entries(query).every(([key, value]) => note[key as keyof noteData] === value),
        );
    };

    getPendingPoints = async (): Promise<number> => {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await client.Database.getConnection();
            const result = await connection.query<{ pendingPoints: number }[]>(
                `
                SELECT SUM(JSON_EXTRACT(data, '$[*].points')) AS pendingPoints
                FROM point_logs
                WHERE JSON_CONTAINS(data, JSON_OBJECT('roblox_id', ?), '$[*]')
                `,
                [this.robloxId],
            );

            return result[0]?.pendingPoints || 0;
        } finally {
            if (connection) await connection.end();
        }
    };

    save = async (): Promise<void> => {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await client.Database.getConnection();
            await connection.beginTransaction();

            const rawNoteData: rawNoteData[] = this.notes.map((note: noteData) => ({
                creator_discord_id: Number.parseInt(note.creator.id),
                creator_discord_username: note.creator.username,
                created_at: note.createdAt.toISOString(),
                content: note.content,
                id: note.id,
            }));

            const result = await connection.query(
                `UPDATE guild_users SET
                    points = ?,
                    notes = ?,
                    ranklock = ?
                 WHERE _id = ? AND __v = ?
                `,
                [
                    this.points,

                    JSON.stringify(rawNoteData),
                    JSON.stringify(this.ranklock),

                    this._id,
                    this.__v,
                ],
            );

            if (result.affectedRows < 0) throw new Error("Failed to save changes.");

            await connection.commit();
            this.__v = BigInt(this.__v) + 1n;
        } catch (error) {
            if (connection) await connection.rollback();

            throw error;
        } finally {
            if (connection) await connection.end();
        }
    };
}
