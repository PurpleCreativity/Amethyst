import type { User } from "discord.js";
import mariadb, { SqlError } from "mariadb";
import type Client from "../classes/Client.ts";

export default class Database {
    client: Client;
    private pool: mariadb.Pool;

    constructor(client: Client) {
        this.client = client;
        this.pool = mariadb.createPool(client.config.credentials.database);
    }

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

    query = async (sql: string | mariadb.QueryOptions, values?: unknown[]): Promise<unknown> => {
        const connection = await this.getConnection();
        try {
            return await connection.query(sql, values);
        } finally {
            await connection.end();
        }
    };

    //! TODO: modify some values later
    //! maybe port into sql files instead of string code
    private initializeTables = async () => {
        const stringContentLength = 512;

        const connection = await this.getConnection();

        try {
            await connection.query(
                `CREATE TABLE IF NOT EXISTS user_profiles (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                    iv VARBINARY(16) NOT NULL,

                    discord_id VARCHAR(20) NOT NULL UNIQUE,
                    discord_username VARCHAR(32) NOT NULL,

                    roblox_id BIGINT UNSIGNED UNIQUE,
                    roblox_username VARCHAR(20),

                    settings JSON NOT NULL DEFAULT '{}',
                    fflags JSON NOT NULL DEFAULT '{}',

                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                );`,
            );

            await connection.query(
                `CREATE TABLE IF NOT EXISTS guild_profiles (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

                    iv VARBINARY(16) NOT NULL,
                    shortname VARCHAR(10) NOT NULL UNIQUE,

                    guild_id VARCHAR(20) NOT NULL,
                    guild_name VARCHAR(100) NOT NULL,

                    roblox_group_id VARCHAR(20),

                    api_rover_key VARCHAR(100),
                    api_bloxlink_key VARCHAR(100),
                    api_enabled BOOLEAN NOT NULL DEFAULT FALSE,

                    settings JSON NOT NULL DEFAULT '{}',
                    fflags JSON NOT NULL DEFAULT '{}',

                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                );`,
            );

            await connection.query(
                `CREATE TABLE IF NOT EXISTS guild_users (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    guild_profile_id BIGINT UNSIGNED NOT NULL,
                    user_profile_id BIGINT UNSIGNED NOT NULL,

                    points INT NOT NULL,

                    note_content VARCHAR(${stringContentLength}),
                    note_visible BOOLEAN NOT NULL DEFAULT TRUE,
                    note_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                    ranklock_rank INT UNSIGNED NOT NULL DEFAULT 0,
                    ranklock_shadow BOOLEAN NOT NULL DEFAULT FALSE,
                    ranklock_reason VARCHAR(${stringContentLength}),
                    ranklock_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                    FOREIGN KEY (guild_profile_id) REFERENCES guild_profiles(id),
                    FOREIGN KEY (user_profile_id) REFERENCES user_profiles(id)
                );`,
            );

            await connection.query(
                `CREATE TABLE IF NOT EXISTS roblox_places (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    guild_profile_id BIGINT UNSIGNED NOT NULL,

                    place_nickname VARCHAR(32) NOT NULL,
                    place_id VARCHAR(20) NOT NULL,
                    place_key VARCHAR(1000) NOT NULL,

                    FOREIGN KEY (guild_profile_id) REFERENCES guild_profiles(id)
                );`,
            );

            await connection.query(
                `CREATE TABLE IF NOT EXISTS api_keys (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    guild_profile_id BIGINT UNSIGNED NOT NULL,

                    key_name VARCHAR(20) NOT NULL,
                    key_value VARCHAR(100) NOT NULL,
                    enabled BOOLEAN NOT NULL DEFAULT TRUE,
                    permissions JSON NOT NULL DEFAULT '{}',

                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    created_by BIGINT UNSIGNED NOT NULL,

                    FOREIGN KEY (guild_profile_id) REFERENCES guild_profiles(id),
                    FOREIGN KEY (created_by) REFERENCES user_profiles(id)
                );`,
            );

            await connection.query(
                `CREATE TABLE IF NOT EXISTS point_logs (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    guild_profile_id BIGINT UNSIGNED NOT NULL,

                    data JSON NOT NULL,
                    notes VARCHAR(${stringContentLength}),

                    creator_name VARCHAR(100) NOT NULL,
                    creator_id VARCHAR(20) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                    FOREIGN KEY (guild_profile_id) REFERENCES guild_profiles(id)
                );`,
            );

            await connection.query(
                `CREATE TABLE IF NOT EXISTS schedule_types (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    guild_profile_id BIGINT UNSIGNED NOT NULL,
                    name VARCHAR(32) NOT NULL,

                    icon VARCHAR(1024) NOT NULL,
                    color VARCHAR(20) NOT NULL,
                    description VARCHAR(${stringContentLength}),

                    use_roblox_schedule BOOLEAN NOT NULL DEFAULT FALSE,
                    use_discord_schedule BOOLEAN NOT NULL DEFAULT FALSE,

                    can_schedule_roles JSON NOT NULL DEFAULT '{}',
                    can_schedule_users JSON NOT NULL DEFAULT '{}',

                    FOREIGN KEY (guild_profile_id) REFERENCES guild_profiles(id)
                );`,
            );

            await connection.query(
                `CREATE TABLE IF NOT EXISTS schedule_events (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    guild_profile_id BIGINT UNSIGNED NOT NULL,

                    type VARCHAR(100) NOT NULL,
                    notes VARCHAR(${stringContentLength}),
                    place_id BIGINT UNSIGNED,

                    time BIGINT NOT NULL,
                    duration INT NOT NULL,

                    host_name VARCHAR(100) NOT NULL,
                    host_id BIGINT UNSIGNED NOT NULL,

                    ongoing BOOLEAN NOT NULL DEFAULT FALSE,

                    discord_event_id VARCHAR(32) NOT NULL,
                    roblox_event_id VARCHAR(32) NOT NULL,

                    FOREIGN KEY (guild_profile_id) REFERENCES guild_profiles(id)
                );`,
            );

            this.client.success("Initialized Database tables");
        } catch (error) {
            this.client.error("There was an error initialising the Database tables:");
            this.client.error(error);

            process.exit(1);
        }
    };

    Init = async () => {
        await this.initializeTables();
    };
}
