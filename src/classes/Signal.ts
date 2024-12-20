class Connection<Params extends unknown[]> {
    signal: Signal<Params>;
    function: (...args: Params) => void | Promise<void>;
    sync = false;
    constructor(signal: Signal<Params>, callback: (...args: Params) => void | Promise<void>, sync = false) {
        this.signal = signal;
        this.function = callback;
        this.sync = sync;
    }

    /**
     * Disconnects the connection from the signal
     */

    disconnect(): void {
        const index = this.signal.connections.indexOf(this);
        if (index !== -1) {
            this.signal.connections.splice(index, 1);
        }
    }

    isConnected(): boolean {
        return this.signal.connections.includes(this);
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
            if (!con.sync) {
                (() => {
                    con.function(...args);
                })();
            } else {
                await con.function(...args);
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
            await con.function(...args);
        }
    }

    /**
     * Forces all connections to run asynchronously
     * @param args The arguments to pass to the connections
     */
    fireAsync(...args: Params): void {
        for (const con of this.connections) {
            (() => {
                con.function(...args);
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
