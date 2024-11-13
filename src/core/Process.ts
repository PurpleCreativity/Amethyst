import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import type Client from "../classes/Client.ts";
import Event from "../classes/Event.ts";

export default class Process {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    Init = async (): Promise<void> => {
        for (const file of fs.readdirSync(path.join(process.cwd(), "src/events"))) {
            if (!file.endsWith(".ts")) continue;

            const eventClass = await import(`file://${path.join(process.cwd(), "src/events", file)}`);
            if (!(eventClass.default || eventClass.default instanceof Event)) continue;

            this.client.Events.AddEvent(eventClass.default.type, file.slice(0, -3), (...args: unknown[]) =>
                eventClass.default.callback(this.client, ...args),
            );
        }

        if (this.client.devMode) {
            this.client.Events.AddEvent("client", "debug", (message: unknown) => this.client.verbose(message));
            this.client.Events.AddEvent("client", "warn", (message: unknown) => this.client.warn(message));
        }

        this.client.success("Initialized Process");
    };
}
