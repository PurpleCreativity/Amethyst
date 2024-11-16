import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import type Client from "../classes/Client.js";
import Event from "../classes/Event.js";

export default class Process {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    loadEventFiles = async (Filespath: string): Promise<void> => {
        const eventsDir = path.join(process.cwd(), Filespath);

        for (const file of fs.readdirSync(eventsDir)) {
            if (file.endsWith(".map")) continue;
            if (!file.endsWith(".js")) continue;

            const eventClass = await import(`file://${path.join(eventsDir, file)}`);
            if (!(eventClass.default || eventClass.default instanceof Event)) continue;

            this.client.Events.AddEvent(eventClass.default.type, file.slice(0, -3), eventClass.default.callback);
        }
    };

    Init = async (): Promise<void> => {
        await this.loadEventFiles("build/events");

        if (this.client.devMode) {
            this.client.Events.AddEvent("client", "debug", (message: unknown) => this.client.verbose(message));
            this.client.Events.AddEvent("client", "warn", (message: unknown) => this.client.warn(message));
        }

        this.client.success("Initialized Process");
    };
}
