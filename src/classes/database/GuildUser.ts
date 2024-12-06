import type mariadb from "mariadb";
import client from "../../main.js";

export type ranklockData = {
    rank: number;
    reason: string | null;
    shadow: boolean;
};

export type noteData = {
    creator_discord_id: number;
    content: string;
    created_at: Date;

    id: string;
};

export type rawGuildUserData = {
    _id: number;
    __v: number;

    guild_id: number;
    roblox_id: number;

    points: number;

    notes: noteData[];
    ranklock: ranklockData;
};

export default class GuildUser {
    readonly _id: number;
    readonly __v: number;

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

        this.notes = rawdata.notes;
        this.ranklock = rawdata.ranklock;
    }

    getNote = (noteId: string): noteData | undefined => {
        return this.notes.find((data) => data.id === noteId);
    };

    removeNote = (noteId: string) => {
        this.notes = this.notes.filter((data) => data.id !== noteId);
    };

    addNote = (creatorId: number, content: string): string => {
        const id = client.Functions.GenerateUUID();

        this.notes.push({
            creator_discord_id: creatorId,
            content: content,
            created_at: new Date(),

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
}
