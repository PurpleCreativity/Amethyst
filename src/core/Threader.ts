import type Client from "../classes/Client.js";
import Signal from "../classes/Signal.js";

export class Thread<V extends (...args: unknown[]) => unknown> {
    Name: string;
    RawFunction: V;
    Running = false;
    Active = true;
    private Looped = false;
    Threader: Threader;
    Id: string = crypto.randomUUID();
    client: Client;
    Interval = 0;

    Resumed: Signal<unknown[]> = new Signal();
    Finished: Signal<unknown[]> = new Signal();

    constructor(Threader: Threader, name: string, func: V) {
        this.Name = name;
        this.RawFunction = func;
        this.Threader = Threader;
        this.client = Threader.client;
    }

    /**
     * Runs the thread for a single iteration
     * @param args The arguments to pass to the function
     * @returns Promise that resolves when the function is done running
     */
    run(...args: Parameters<V>): Promise<void> {
        this.Active = true;
        return (async () => {
            await this.RawFunction(...args);
            this.Finished.fire();
        })();
    }

    /**
     * Runs the thread in a loop until its halted
     * @param interval How long to wait between each iteration
     * @param args The arguments to pass to the function
     * @returns self
     */
    loop(interval: number, ...args: Parameters<V>): this {
        this.Looped = true;
        this.Active = true;
        this.Running = true;
        this.Interval = interval;
        (async () => {
            while (this.Active) {
                if (!this.Running) {
                    await this.Resumed.wait();
                }
                await this.RawFunction(...args);
                await this.Finished.fire();
                await new Promise((res) => {
                    setTimeout(res, this.Interval);
                });
            }
        })();
        return this;
    }

    /**
     * Halts the thread if its looped
     */

    halt(): void {
        this.Running = false;
    }

    /**
     * Halts the thread for a certain amount of time
     * @param time How long to halt the thread for
     */

    async haltFor(time: number): Promise<void> {
        this.halt();
        await new Promise((res) => {
            setTimeout(res, time);
        });
        this.resume();
    }

    /**
     * Resumes the thread if its halted
     */

    resume(): void {
        this.Running = true;
        this.Resumed.fire();
    }

    end(): void {
        /**
         * Ends the thread if its looped
         */
        this.Active = false;
    }

    IsLooped(): boolean {
        return this.Looped;
    }

    /**
     * Destroys the thread
     */
    destroy(): void {
        this.end();
        this.Threader.Threads = this.Threader.Threads.filter((thread) => thread !== this);
        // Destroy this thread
        for (const key in this) {
            delete this[key];
        }
    }
}

export default class Threader {
    client: Client;
    Threads = [] as Thread<(...args: unknown[]) => unknown>[];

    private Thread = Thread;

    constructor(client: Client) {
        this.client = client;
    }

    createThread = <V extends (...args: unknown[]) => unknown>(name: string, func: V): Thread<V> => {
        const thread = new this.Thread(this, name, func);
        this.Threads.push(thread);
        return thread;
    };

    getThreadByName = (name: string): Thread<(...args: unknown[]) => unknown> | undefined => {
        return this.Threads.find((thread) => thread.Name === name);
    };

    getThreadById = (id: string): Thread<(...args: unknown[]) => unknown> | undefined => {
        return this.Threads.find((thread) => thread.Id === id);
    };

    getThread = (nameOrId: string): Thread<(...args: unknown[]) => unknown> | undefined => {
        return this.getThreadById(nameOrId) || this.getThreadByName(nameOrId);
    };

    endAll = (): void => {
        for (const thread of this.Threads) {
            thread.end();
        }
    };

    destroyAll = (): void => {
        for (const thread of this.Threads) {
            thread.destroy();
        }
    };

    haltAll = (): void => {
        for (const thread of this.Threads) {
            thread.halt();
        }
    };

    cleanUp = (): void => {
        this.endAll();
    };
}
