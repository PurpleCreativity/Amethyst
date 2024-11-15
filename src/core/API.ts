// @deno-types="npm:@types/express"
import express from "express";
import type Client from "../classes/Client.ts";

export default class API {
    client: Client;
    server: express.Application = express();

    constructor(client: Client) {
        this.client = client;
    }

    Init = async () => {
        this.server.listen(this.client.config.port, () => {
            console.log(`Server is running on port ${this.client.config.port}`);
        });
    };
}
