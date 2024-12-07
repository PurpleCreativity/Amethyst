import type mariadb from "mariadb";
import client from "../../main.js";

export type rawUserData = {
    _id: bigint;
    __v: bigint;

    discord_id: bigint;
    roblox_id: bigint | null;
    roblox_username: string | null;

    settings: Record<string, unknown>;
};

export default class UserProfile {
    readonly _id: bigint;
    __v: bigint;

    readonly discordId: string;
    readonly roblox: {
        id: number | null;
        username: string | null;
    };

    readonly settings: Record<string, unknown>;

    constructor(rawdata: rawUserData) {
        this._id = rawdata._id;
        this.__v = rawdata.__v;

        this.discordId = rawdata.discord_id.toString();
        this.roblox = {
            id: rawdata.roblox_id ? Number.parseInt(rawdata.roblox_id.toString()) : null,
            username: rawdata.roblox_username,
        };

        this.settings = rawdata.settings;
    }

    getSetting = (key: string): unknown => {
        return this.settings[key] ?? null;
    };

    setSetting = (key: string, value: unknown): void => {
        this.settings[key] = value;
    };

    save = async (): Promise<void> => {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await client.Database.getConnection();
            await connection.beginTransaction();

            const result = await connection.query(
                `UPDATE user_profiles SET
                    roblox_id = ?,
                    roblox_username = ?,
                    settings = ?
                 WHERE _id = ? AND __v = ?
                `,
                [
                    this.roblox.id,
                    this.roblox.username,

                    JSON.stringify(this.settings),

                    this._id,
                    this.__v,
                ],
            );

            if (result.affectedRows < 0) throw new Error("Failed to save changes.");

            await connection.commit();
            this.__v += 1n;
        } catch (error) {
            if (connection) await connection.rollback();

            throw error;
        } finally {
            if (connection) await connection.end();
        }
    };
}
