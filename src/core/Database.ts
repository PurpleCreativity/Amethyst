import type Client from "../classes/Client.ts";

export default class Database {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    Init = async () => {};
}
