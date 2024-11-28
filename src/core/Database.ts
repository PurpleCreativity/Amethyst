import fs from "node:fs";
import path from "node:path";
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
        const filesPath = path.join(process.cwd(), "sql/tables");
        const connection = await this.getConnection();

        const loadingOrder = [
            "user_profiles",
            "guild_profiles",

            "roblox_places",
            "api_keys",
            "point_logs",

            "schedule_types",
            "schedule_events",
        ];

        try {
            for (const tableName of loadingOrder) {
                const filePath = path.join(filesPath, `${tableName}.sql`);

                if (fs.existsSync(filePath)) {
                    const sql = fs.readFileSync(filePath, "utf-8");

                    await connection.query(sql);
                    this.client.verbose(`Initialized table: ${tableName}`);
                } else {
                    this.client.warn(`SQL file for table '${tableName}' not found: ${filePath}`);
                }
            }

            this.client.success("Initialized Database tables");
        } catch (error) {
            this.client.error("There was an error initialising the Database tables:");
            this.client.error(error);

            process.exit(1);
        } finally {
            await connection.end();
        }
    };

    Init = async () => {
        await this.initializeTables();
    };
}
