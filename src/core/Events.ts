import EventEmitter from "node:events";
import process from "node:process";
import type Client from "../classes/Client.ts";

export default class Events {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    connectedEvents = [] as {
        type: "client" | "process" | "custom";
        event?: string;
        emiiter: EventEmitter;
    }[];

    addEvent = (
        type: "client" | "process" | "custom",
        event?: string,
        callback?: (...any: unknown[]) => void,
    ): EventEmitter => {
        let emiiter: EventEmitter;
        switch (type) {
            case "client":
                if (!callback) throw new Error("No callback");
                if (!event) throw new Error("No event");
                emiiter = this.client.on(event, callback) as unknown as EventEmitter;
                break;
            case "process":
                if (!callback) throw new Error("No callback");
                if (!event) throw new Error("No event");
                emiiter = process.on(event, callback);
                break;
            case "custom":
                emiiter = new EventEmitter();

                if (callback && event) {
                    emiiter.on(event, callback);
                }
                break;
            default:
                throw new Error("Invalid event type");
        }

        this.client.log(`Added event ${event} to ${type} events`);

        this.connectedEvents.push({
            type: type,
            event: event,
            emiiter: emiiter,
        });
        return emiiter;
    };

    removeEvent = (emitter: EventEmitter, name?: string): EventEmitter => {
        emitter.removeAllListeners(name);

        const index = this.connectedEvents.findIndex((event) => event.emiiter === emitter);
        if (index !== -1) {
            this.connectedEvents.splice(index, 1);
        } else {
            this.client.warn(`Could not find event ${name} in ${emitter}`);
        }

        if (!name) {
            for (const name of emitter.eventNames()) {
                this.client.log(`Removed event ${String(name)}`);
            }
        } else this.client.log(`Removed event ${name}`);

        return emitter;
    };

    init = (): void => {
        this.client.setMaxListeners(0);

        this.client.success("Initialized Events");
    };
}
