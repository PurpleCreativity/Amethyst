import mariadb, { SqlError } from "mariadb";
import type Client from "../classes/Client.ts";

export default class Database {
    client: Client;
    private pool: mariadb.Pool;
    private cache: {
        users: Map<string, unknown>;
        guilds: Map<string, unknown>;
    } = {
        users: new Map(),
        guilds: new Map(),
    };

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

    query = async (sql: string | mariadb.QueryOptions, params?: unknown[]): Promise<unknown> => {
        const connection = await this.getConnection();
        try {
            return await connection.query(sql, params);
        } finally {
            await connection.end();
        }
    };

    Init = async () => {};
}
