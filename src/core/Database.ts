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

    query = async (sql: string | mariadb.QueryOptions, params?: unknown[]): Promise<unknown> => {
        const connection = await this.getConnection();
        return await connection.query(sql, params);
    };

    Init = async () => {
        console.log(await this.query("SHOW DATABASES;"));
    };
}
