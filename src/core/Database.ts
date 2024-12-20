import fs from "node:fs";
import path from "node:path";
import { Guild, type Snowflake, User } from "discord.js";
import mariadb, { SqlError } from "mariadb";
import type Client from "../classes/Client.ts";
import GuildProfile from "../classes/database/GuildProfile.js";
import GuildUser from "../classes/database/GuildUser.js";
import UserProfile from "../classes/database/UserProfile.js";

export default class Database {
    client: Client;
    private pool: mariadb.Pool;
    readonly loadingOrder = [
        "user_profiles",
        "guild_profiles",

        "guild_users",
        "guild_groups",
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

    addUserProfile = async (discordUser: User | string | Snowflake) => {
        if (typeof discordUser === "string") discordUser = (await this.client.Functions.fetchUser(discordUser)) as User;
        if (!discordUser || !(discordUser instanceof User)) throw new Error("Unknown user.");

        let connection: mariadb.Connection | undefined;
        try {
            connection = await this.getConnection();
            await connection.beginTransaction();

            const insertQuery = await connection.query(
                `INSERT INTO user_profiles (
                    id, roblox_id
                ) VALUES (?, ?);`,
                [discordUser.id, null],
            );

            await connection.commit();

            return insertQuery;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    };

    getUserProfile = async (discordId: string) => {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await this.getConnection();
            const existing = await connection.query("SELECT * FROM user_profiles WHERE id = ?", [discordId]);
            if (existing.length > 0) {
                const rawdata = existing[0];

                return new UserProfile(rawdata);
            }

            await this.addUserProfile(discordId);
            const rawdata = (await connection.query("SELECT * FROM user_profiles WHERE id = ?", [discordId]))[0];

            return new UserProfile(rawdata);
        } finally {
            if (connection) await connection.end();
        }
    };

    addGuildProfile = async (shortname: string, guild: Guild | string | Snowflake) => {
        if (typeof guild === "string") guild = (await this.client.Functions.fetchGuild(guild)) as Guild;
        if (!guild || !(guild instanceof Guild)) throw new Error("Guild not found.");

        let connection: mariadb.Connection | undefined;
        try {
            connection = await this.getConnection();
            await connection.beginTransaction();

            const insertQuery = await connection.query(
                `INSERT INTO guild_profiles (
                    id, shortname
                ) VALUES (?, ?);`,
                [guild.id, shortname],
            );

            await connection.commit();

            return insertQuery;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    };

    getGuildProfile = async (guildId: string) => {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await this.getConnection();
            const existing = await connection.query("SELECT * FROM guild_profiles WHERE id = ?", [guildId]);
            if (existing.length > 0) {
                const rawdata = existing[0];

                return new GuildProfile(rawdata);
            }

            return undefined;
        } finally {
            if (connection) await connection.end();
        }
    };

    private addGuildUserProfile = async (guildId: string, robloxId: number) => {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await this.getConnection();
            await connection.beginTransaction();

            const insertQuery = await connection.query(
                `INSERT INTO guild_users (
                    guild_id, roblox_id,
                    notes, ranklock
                ) VALUES (?, ?, ?, ?);`,
                [
                    guildId,
                    robloxId,
                    JSON.stringify([]),
                    {
                        rank: 0,
                        reason: null,
                        shadow: false,
                    },
                ],
            );

            await connection.commit();

            return insertQuery;
        } catch (error) {
            if (connection) await connection.rollback();
            throw error;
        } finally {
            if (connection) await connection.end();
        }
    };

    getGuildUserProfile = async (guildId: string, robloxId: number) => {
        let connection: mariadb.Connection | undefined;
        try {
            connection = await this.getConnection();
            const existing = await connection.query("SELECT * FROM guild_users WHERE guild_id = ? AND roblox_id = ?", [
                guildId,
                robloxId,
            ]);
            if (existing.length > 0) {
                const rawdata = existing[0];

                return new GuildUser(rawdata);
            }

            await this.addGuildUserProfile(guildId, robloxId);
            const rawdata = (
                await connection.query("SELECT * FROM guild_users WHERE guild_id = ? AND roblox_id = ?", [
                    guildId,
                    robloxId,
                ])
            )[0];

            return new GuildUser(rawdata);
        } finally {
            if (connection) await connection.end();
        }
    };

    init = async () => {
        if (this.client.devMode) await this.initializeTables();

        //await this.addGuildProfile("DEV", "1276574166937505925");
        this.client.success("Initialized Database");
    };
}
