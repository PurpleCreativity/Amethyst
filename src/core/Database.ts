import type Client from "../classes/Client.ts";
import mariadb from "mariadb";

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
            this.client.error('Failed to get database connection:');
            this.client.error(error);
            throw error;
          }
    };

    query = async (sql: string, params?: unknown[]): Promise<unknown> => {
        const connection = await this.getConnection();
        return await connection.query(sql, params);
    };

    Init = async () => {
        console.log(await this.query("SHOW DATABASES"));
    };
}
