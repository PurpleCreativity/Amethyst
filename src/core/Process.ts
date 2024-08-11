import type SuperClient from "../classes/SuperClient.js";

export default class Process {
    client: SuperClient;

    constructor(client: SuperClient) {
        this.client = client;
    }

    Error = async (error: Error) => {
        try {
            //this.client.Logs.LogError(error);
            this.client.error(error);
        } catch (error) {
            this.client.error(error);
        }
    }



    Init = async () => {
        //this.client.Events.AddEvent("client", "interactionCreate", this.interactionCreate);
        //this.client.Events.AddEvent("client", "guildCreate", this.guildCreate);

        this.client.Events.AddEvent("process", "uncaughtException", this.Error);

        this.client.success("Initialized Process");
    }
}