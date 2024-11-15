/*
    Mongoose really does not seem to like Deno
    Types in your IDE will not work,
    but the code will still run and pass the typescript compiler
*/

import mongoose from "mongoose";

import type Client from "../classes/Client.ts";

export default class Database {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    Init = async () => {
        console.log(await mongoose.connect(this.client.config.credentials.databaseURI));
    };
}
