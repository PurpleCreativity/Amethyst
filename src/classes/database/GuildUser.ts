import type mariadb from "mariadb";
import client from "../../main.js";
import type { dataEntry } from "./PointLog.js";

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

    readonly guildId: number;
    readonly robloxId: number;

    points: number;

    notes: noteData[];
    ranklock: ranklockData;

    constructor(rawdata: rawGuildUserData) {
        this._id = rawdata._id;
        this.__v = rawdata.__v;

        this.guildId = rawdata.guild_id;
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
            const pointLogs = await connection.query<{ data: dataEntry[] }[]>("SELECT data FROM point_logs");

            return pointLogs.reduce((total, row) => {
                const rowPoints = row.data.reduce((sum, entry) => sum + entry.points, 0);
                return total + rowPoints;
            }, 0);
        } finally {
            if (connection) await connection.end();
        }
    };
}
