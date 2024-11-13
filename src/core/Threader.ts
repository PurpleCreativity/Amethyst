import type Client from "../classes/Client.ts";
import Signal from "../classes/Signal.ts";

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
    Run = (...args: Parameters<V>): Promise<void> => {
        this.Active = true;
        return (async () => {
            await this.RawFunction(...args);
            this.Finished.Fire();
        })();
    };

    /**
     * Runs the thread in a loop until its halted
     * @param interval How long to wait between each iteration
     * @param args The arguments to pass to the function
     * @returns self
     */
    Loop = (interval: number, ...args: Parameters<V>): this => {
        this.Looped = true;
        this.Active = true;
        this.Running = true;
        this.Interval = interval;
        (async () => {
            while (this.Active) {
                if (!this.Running) {
                    await this.Resumed.Wait();
                }
                await this.RawFunction(...args);
                await this.Finished.Fire();
                await new Promise((res) => {
                    setTimeout(res, this.Interval);
                });
            }
        })();
        return this;
    };

    /**
     * Halts the thread if its looped
     */

    Halt = (): void => {
        this.Running = false;
    };

    /**
     * Halts the thread for a certain amount of time
     * @param time How long to halt the thread for
     */

    HaltFor = async (time: number): Promise<void> => {
        this.Halt();
        await new Promise((res) => {
            setTimeout(res, time);
        });
        this.Resume();
    };

    /**
     * Resumes the thread if its halted
     */

    Resume = (): void => {
        this.Running = true;
        this.Resumed.Fire();
    };

    End = (): void => {
        /**
         * Ends the thread if its looped
         */
        this.Active = false;
    };

    IsLooped = (): boolean => {
        return this.Looped;
    };

    /**
     * Destroys the thread
     */
    Destroy = (): void => {
        this.End();
        this.Threader.Threads = this.Threader.Threads.filter((thread) => thread !== this);
        // Destroy this thread
        for (const key in this) {
            delete this[key];
        }
    };
}

export default class Threader {
    client: Client;
    Threads = [] as Thread<(...args: unknown[]) => unknown>[];

    private Thread = Thread;

    constructor(client: Client) {
        this.client = client;
    }

    CreateThread = <V extends (...args: unknown[]) => unknown>(name: string, func: V): Thread<V> => {
        const thread = new this.Thread(this, name, func);
        this.Threads.push(thread);
        return thread;
    };

    GetThreadByName = (name: string): Thread<(...args: unknown[]) => unknown> | undefined => {
        return this.Threads.find((thread) => thread.Name === name);
    };

    GetThreadById = (id: string): Thread<(...args: unknown[]) => unknown> | undefined => {
        return this.Threads.find((thread) => thread.Id === id);
    };

    GetThread = (nameOrId: string): Thread<(...args: unknown[]) => unknown> | undefined => {
        return this.GetThreadById(nameOrId) || this.GetThreadByName(nameOrId);
    };

    EndAll = (): void => {
        for (const thread of this.Threads) {
            thread.End();
        }
    };

    DestroyAll = (): void => {
        for (const thread of this.Threads) {
            thread.Destroy();
        }
    };

    /**
     * Halts all threads
     */
    HaltAll = (): void => {
        for (const thread of this.Threads) {
            thread.Halt();
        }
    };

    CleanUp = (): void => {
        this.EndAll();
    };
}
