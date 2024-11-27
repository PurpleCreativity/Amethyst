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

    private initializeTables = async () => {
        const connection = await this.getConnection();

        try {
            await connection.query(
                `CREATE TABLE IF NOT EXISTS UserProfile (
                    IV VARCHAR(255) NOT NULL UNIQUE,

                    Id VARCHAR(255) PRIMARY KEY,
                    Name VARCHAR(255) NOT NULL,

                    RobloxId BIGINT DEFAULT NULL,
                    RobloxUsername VARCHAR(255) DEFAULT NULL,
                    RobloxUpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                    FFlags JSON DEFAULT '{}',
                    Settings JSON DEFAULT '{}',

                    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`,
            );

            this.client.success("Initialized Database tables");
        } catch (error) {
            this.client.error("There was an error initialising the Database tables:");
            this.client.error(error);

            process.exit(1);
        }

        await connection.end();
    };

    private addUser = async (user: User) => {
        const connection = await this.getConnection();

        try {
            return await connection.query(
                `
                INSERT INTO UserProfile (
                    iv, user_id, user_name, 
                    roblox_user_id, roblox_user_name,
                    roblox_updated_at, FFlags, settings
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                
                ON DUPLICATE KEY UPDATE 
                    user_name = VALUES(user_name),
                    roblox_user_id = VALUES(roblox_user_id),
                    roblox_user_name = VALUES(roblox_user_name),
                    roblox_updated_at = VALUES(roblox_updated_at),
                    FFlags = VALUES(FFlags),
                    settings = VALUES(settings);
                `,
                [this.client.Functions.GenerateIV(), user.id, user.username, null, null, new Date(), "{}", "{}"],
            );
        } catch (error) {
            this.client.error(error);
        }
    };

    Init = async () => {
        await this.initializeTables();
    };
}
