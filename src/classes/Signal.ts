class Connection<Params extends unknown[]> {
    Signal: Signal<Params>;
    Function: (...args: Params) => void | Promise<void>;
    Sync = false;
    constructor(signal: Signal<Params>, callback: (...args: Params) => void | Promise<void>, sync = false) {
        this.Signal = signal;
        this.Function = callback;
        this.Sync = sync;
    }

    /**
     * Disconnects the connection from the signal
     */

    disconnect(): void {
        const index = this.Signal.connections.indexOf(this);
        if (index !== -1) {
            this.Signal.connections.splice(index, 1);
        }
    }

    IsConnected(): boolean {
        return this.Signal.connections.includes(this);
    }
}

export default class Signal<Params extends unknown[]> {
    connections: Connection<Params>[] = [];

    /**
     * Creates a connection to the signal that will run the callback when the signal is fired
     * @param callback The function to run when the signal is fired
     * @returns connection object that can be used to disconnect the connection
     */
    connect(callback: (...args: Params) => void | Promise<void>): Connection<Params> {
        const con = new Connection(this, callback);
        this.connections.push(con);
        return con;
    }

    /**
     * Connects to the signal synchronously
     * @param callback The function to run when the signal is fired
     * @returns connection object that can be used to disconnect the connection
     */

    connectSync(callback: (...args: Params) => void | Promise<void>): Connection<Params> {
        const con = new Connection(this, callback, true);
        this.connections.push(con);
        return con;
    }

    /**
     * Fires the signal and runs all the connections
     * @param args The arguments to pass to the connections
     */
    async fire(...args: Params): Promise<void> {
        for (const con of this.connections) {
            // Run each connect in async
            if (!con.Sync) {
                (() => {
                    con.Function(...args);
                })();
            } else {
                await con.Function(...args);
            }
        }
    }

    /**
     * Connects to the signal and runs the callback only once
     * @param callback The function to run when the signal is fired
     * @returns connection object that can be used to disconnect the connection
     */
    once(callback: (...args: Params) => void | Promise<void>): Connection<Params> {
        const con = this.connect(async (...args) => {
            con.disconnect();
            await callback(...args);
        });
        return con;
    }

    emit = this.fire; // Alias for Fire
    on = this.connect; // Alias for Connect

    /**
     * Fires the signal and runs all the connections synchronously
     * @param args The arguments to pass to the connections
     */
    async fireSync(...args: Params): Promise<void> {
        for (const con of this.connections) {
            await con.Function(...args);
        }
    }

    /**
     * Forces all connections to run asynchronously
     * @param args The arguments to pass to the connections
     */
    fireAsync(...args: Params): void {
        for (const con of this.connections) {
            (() => {
                con.Function(...args);
            })();
        }
    }

    /**
     * Disconnects all connections to the signal
     */
    disconnectAll(): void {
        this.connections = [];
    }

    /**
     * Wait for the signal to be fired
     * @returns Promise that resolves when the signal is fired
     */

    wait(): Promise<Params> {
        return new Promise((resolve) => {
            const con = this.connect((...args) => {
                con.disconnect();
                resolve(args);
            });
        });
    }
}
