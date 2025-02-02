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

        const loadEventsfromDir = async (dir: string) => {
            for (const eventFile of fs.readdirSync(dir)) {
                const eventPath = path.join(dir, eventFile);
                if (fs.statSync(eventPath).isDirectory()) {
                    await loadEventsfromDir(eventPath);
                }

                if (!eventPath.endsWith(".js")) continue;

                const event = await import(`file://${eventPath}`).then((module) => module.default);

                if (!(event instanceof Event)) {
                    this.client.warn(`Event [${eventPath}] is not a valid event.`);
                    return;
                }

                this.client.Events.addEvent(event.type, eventFile.slice(0, -3), event.listener);
            }
        };

        await loadEventsfromDir(eventsDir);
    };

    init = async (): Promise<void> => {
        await this.loadEventFiles("build/events");

        if (this.client.devMode) {
            this.client.Events.addEvent("client", "debug", (message: unknown) => this.client.verbose(message));
            this.client.Events.addEvent("client", "warn", (message: unknown) => this.client.warn(message));
        }

        this.client.success("Initialized Process");
    };
}
