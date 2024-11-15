/*
    Mongoose really does not seem to like Deno
    Types in your IDE will not work,
    but the code will still run and pass the typescript compiler
*/

import mongoose from "mongoose";

import type Client from "../classes/Client.ts";
import type { guildProfileInterface } from "../schemas/guildProfile.ts";
import type { userProfileInterface } from "../schemas/userProfile.ts";

export default class Database {
    client: Client;

    cache = {
        guilds: new Map<string, guildProfileInterface>(),
        users: new Map<string, userProfileInterface>(),
    };

    constructor(client: Client) {
        this.client = client;
    }

    Init = async () => {
        try {
            await mongoose.connect(this.client.config.credentials.databaseURI);
        } catch (error) {
            this.client.error("Failed to connect to database");
            this.client.error(error);
        }

        if (mongoose.connection.readyState === 1) this.client.success("Connected to Database");
    };
}
