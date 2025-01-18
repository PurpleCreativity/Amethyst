import { REST } from "discord.js";
import type Client from "../classes/Client.js";

export default class Interactables {
    client: Client;
    REST: REST = new REST();

    constructor(client: Client) {
        this.client = client;
    }

    afterInit = async (): Promise<void> => {
        this.REST.setToken(this.client.config.credentials.discordToken);
    };
}
