import fs from "node:fs";
import path from "node:path";
import { type Snowflake, User } from "discord.js";
import mariadb, { SqlError } from "mariadb";
import type Client from "../classes/Client.ts";
import UserProfile from "../classes/database/UserProfile.js";

export default class Database {
    client: Client;
    private pool: mariadb.Pool;
    readonly loadingOrder = [
        "user_profiles",
        "guild_profiles",

        "roblox_places",
        "api_keys",
        "point_logs",

        "schedule_types",
        "schedule_events",
    ];

    constructor(client: Client) {
        this.client = client;
        this.pool = mariadb.createPool(client.config.credentials.database);
    }

    //? Internal Methods

    getConnection = async (): Promise<mariadb.Connection> => {
        try {
            return await this.pool.getConnection();
        } catch (error) {
            if (!(error instanceof SqlError)) throw new Error("Unknown error");

            this.client.error(`Failed to get database connection: ${error.sqlMessage}`);
            throw error;
        }
    };

    closeConnection = async (): Promise<void> => {
        await this.pool.end();
        this.client.warn("Database pool closed");
    };

    private initializeTables = async () => {
        const filesPath = path.join(process.cwd(), "sql");
        const connection = await this.getConnection();

        try {
            for (const tableName of this.loadingOrder) {
                const filePath = path.join(filesPath, `${tableName}.sql`);

                if (fs.existsSync(filePath)) {
                    const sql = fs.readFileSync(filePath, "utf-8");

                    await connection.query(sql);

                    this.client.verbose(`Initialized table: ${tableName}`);
                } else {
                    // this.client.warn(`SQL file for table '${tableName}' not found: ${filePath}`);
                }
            }

            this.client.success("Initialized Database tables");
        } catch (error) {
            this.client.error("There was an error initializing the Database tables:");
            this.client.error(error);

            process.exit(1);
        } finally {
            await connection.end();
        }
    };

    //? Data handling

    private addUserProfile = async (user: User | string | Snowflake) => {
        if (typeof user === "string") user = (await this.client.Functions.fetchUser(user)) as User;
        if (!user || !(user instanceof User)) throw new Error("Unknown user.");

        const connection = await this.getConnection();

        try {
            const insertQuery = await connection.query(
                `INSERT INTO user_profiles (
                    iv, discord_id, discord_username,
                    roblox_id, roblox_username,
                    settings, fflags
                ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
                [this.client.Functions.GenerateIV(), user.id, user.username, null, null, "{}", "{}"],
            );

            return insertQuery;
        } catch (error) {
            this.client.error(`Failed to add user [${user.username}:${user.id}] to the database:`);
            this.client.error(error);
        } finally {
            await connection.end();
        }
    };

    getUserProfile = async (userId: string) => {
        const connection = await this.getConnection();
        try {
            const existingUser = await connection.query("SELECT * FROM user_profiles WHERE discord_id = ?", [userId]);
            if (existingUser.length > 0) {
                const rawdata = existingUser[0];

                return new UserProfile(rawdata);
            }

            const profile_id = (await this.addUserProfile(userId)).insertId;
            const rawdata = (await connection.query("SELECT * FROM user_profiles WHERE _id = ?", [profile_id]))[0];

            return new UserProfile(rawdata);
        } catch (error) {
            this.client.error(`Failed to get user [${userId}] to the database:`);
            this.client.error(error);
        } finally {
            await connection.end();
        }
    };

    Init = async () => {
        if (this.client.devMode) await this.initializeTables();

        const profile = await this.getUserProfile("762329291169857537");
        if (!profile) return;
        console.log(profile);

        profile.setSetting("hello", 1);
        console.log(profile.getSetting("hello"));

        console.log(profile);

        await profile.save();
    };
}
