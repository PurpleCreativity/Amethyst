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
    created_at: Date,

    id: string;
};

export type rawGuildUserData = {
    _id: number;
    __v: number;

    guild_id: number;
    roblox_id: number;
    discord_id: number | null;

    points: number;

    notes: noteData[];
    ranklock: ranklockData;
}

export default class GuildUser {
    readonly rawdata: rawGuildUserData;

    readonly _id: number;
    readonly __v: number;

    readonly guild_id: number;
    readonly roblox_id: number;
    discord_id: number | null;

    points: number;

    notes: noteData[];
    ranklock: ranklockData;

    constructor(rawdata: rawGuildUserData) {
        this.rawdata = rawdata;

        this._id = rawdata._id;
        this.__v = rawdata.__v;

        this.guild_id = rawdata.guild_id;
        this.roblox_id = rawdata.roblox_id;
        this.discord_id = rawdata.discord_id;

        this.points = rawdata.points;

        this.notes = rawdata.notes;
        this.ranklock = rawdata.ranklock;
    }

    getNote = (noteId: string): noteData | undefined => {
        return this.notes.find((data) => data.id === noteId)
    };

    removeNote = (noteId: string) => {
        this.notes = this.notes.filter((data) => data.id !== noteId);
    }

    addNote = (creatorId: number, content: string): string => {
        const id = client.Functions.GenerateUUID()

        this.notes.push({
            creator_discord_id: creatorId,
            content: content,
            created_at: new Date(),

            id: id
        });

        return id;
    };

    getNotes = (query: Partial<noteData>): noteData[] => {
        return this.notes.filter((note) =>
            Object.entries(query).every(([key, value]) => note[key as keyof noteData] === value)
        );
    };

    getPendingPoints = async (): Promise<number> => {
        const connection = await client.Database.getConnection();
    
        try {
            const pointLogs = await connection.query<{ data: dataEntry[] }[]>("SELECT data FROM point_logs");
    
            return pointLogs.reduce((total, row) => {
                const rowPoints = row.data.reduce((sum, entry) => sum + entry.points, 0);
                return total + rowPoints;
            }, 0);
        } finally {
            await connection.end();
        }
    };
};