export type EventOptions = {
    type: "client" | "process" | "custom";
    callback: (...args: unknown[]) => unknown | Promise<unknown>;
};

export default class Event {
    type: "client" | "process" | "custom";
    callback: (...args: unknown[]) => unknown | Promise<unknown>;

    constructor(options: EventOptions) {
        this.type = options.type;
        this.callback = options.callback;
    }
}
