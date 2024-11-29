import fs from "node:fs";
import path from "node:path";
import { Guild, type Snowflake, User } from "discord.js";
import mariadb, { SqlError } from "mariadb";
import type Client from "../classes/Client.ts";
import UserProfile from "../classes/database/UserProfile.js";
import GuildProfile from "../classes/database/GuildProfile.js";

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

    private initializeTables = async () => {
        const filesPath = path.join(process.cwd(), "sql");
        const connection = await this.getConnection();

        try {
            await connection.beginTransaction();

            for (const tableName of this.loadingOrder) {
                const filePath = path.join(filesPath, `${tableName}.sql`);

                if (fs.existsSync(filePath)) {
                    const sql = fs.readFileSync(filePath, "utf-8");

                    await connection.query(sql);

                    this.client.verbose(`Initialized table: ${tableName}`);
                } else {
                    this.client.warn(`SQL file for table '${tableName}' not found: ${filePath}`);
                }
            }

            await connection.commit();
            this.client.success("Initialized Database tables");
        } catch (error) {
            this.client.error("There was an error initializing the Database tables:");
            this.client.error(error);
            await connection.rollback();

            process.exit(1);
        } finally {
            await connection.end();
        }
    };

    //? Data handling

    addUserProfile = async (user: User | string | Snowflake) => {
        if (typeof user === "string") user = (await this.client.Functions.fetchUser(user)) as User;
        if (!user || !(user instanceof User)) throw new Error("Unknown user.");

        const connection = await this.getConnection();

        try {
            await connection.beginTransaction();

            const insertQuery = await connection.query(
                `INSERT INTO user_profiles (
                    _iv, discord_id, discord_username,
                    roblox_id, roblox_username
                ) VALUES (?, ?, ?, ?, ?);`,
                [this.client.Functions.GenerateIV(), user.id, user.username, null, null],
            );

            await connection.commit();

            return insertQuery;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            await connection.end();
        }
    };

    getUserProfile = async (userId: string) => {
        const connection = await this.getConnection();
        try {
            const existing = await connection.query("SELECT * FROM user_profiles WHERE discord_id = ?", [userId]);
            if (existing.length > 0) {
                const rawdata = existing[0];

                return new UserProfile(rawdata);
            }

            const profile_id = (await this.addUserProfile(userId)).insertId;
            const rawdata = (await connection.query("SELECT * FROM user_profiles WHERE _id = ?", [profile_id]))[0];

            return new UserProfile(rawdata);
        } finally {
            await connection.end();
        }
    };

    addGuildProfile = async (shortname: string, guild: Guild | string | Snowflake) => {
        if (typeof guild === "string") guild = await this.client.Functions.fetchGuild(guild) as Guild;
        if (!guild || !(guild instanceof Guild)) throw new Error("Guild not found.");

        const connection = await this.getConnection();

        try {
            await connection.beginTransaction();

            const insertQuery = await connection.query(
                `INSERT INTO guild_profiles (
                    _iv, shortname,
                    guild_id, guild_name
                ) VALUES (?, ?, ?, ?);`,
                [this.client.Functions.GenerateIV(), shortname, guild.id, guild.name],
            );

            await connection.commit();

            return insertQuery;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            await connection.end();
        }
    };

    getGuildProfile = async (guildId: string) => {
        const connection = await this.getConnection();
        try {
            const existing = await connection.query("SELECT * FROM guild_profiles WHERE guild_id = ?", [guildId]);
            if (existing.length > 0) {
                const rawdata = existing[0];

                return new GuildProfile(rawdata);
            }

            return undefined;
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

        //await this.addGuildProfile("DEV", "1276574166937505925");
        console.log(await this.getGuildProfile("1276574166937505925"));
    };
}
