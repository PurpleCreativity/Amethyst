/*
	@SuperCater Athena
*/

/**
 * Creates a signal that can be connected to
 * @class Signal
 */

class Connection<Params extends any[]>{
	Signal : Signal<Params>;
	Function : (...args : Params) => void | Promise<void>;
	Sync = false;
	constructor(signal : Signal<Params>, callback : (...args : Params) => void | Promise<void>, sync = false) {
		this.Signal = signal;
		this.Function = callback;
		this.Sync = sync;
	}
	
	/**
	 * Disconnects the connection from the signal
	 */
	
	Disconnect = () => {
		const index = this.Signal.connections.indexOf(this);
		if(index !== -1) {
			this.Signal.connections.splice(index, 1);
		}
	};
	
	IsConnected = () => {
		return this.Signal.connections.includes(this);
	}
	
}


class Signal<Params extends any[]> {
	

	
	connections : Connection<Params>[] = [];
	

	
	
	/**
	 * Creates a connection to the signal that will run the callback when the signal is fired
	 * @param callback The function to run when the signal is fired
	 * @returns connection object that can be used to disconnect the connection
	 */
	Connect = (callback: (...args : Params) => void | Promise<void>) => {
		const con = new Connection(this, callback);
		this.connections.push(con);
		return con;
	};
	
	/**
	 * Connects to the signal synchronously
	 * @param callback The function to run when the signal is fired
	 * @returns connection object that can be used to disconnect the connection
	 */
	
	ConnectSync = (callback: (...args : Params) => void | Promise<void>) => {
		const con = new Connection(this, callback, true);
		this.connections.push(con);
		return con;
	}
	
	/**
	 * Fires the signal and runs all the connections
	 * @param args The arguments to pass to the connections
	 */
	Fire = async (...args : Params) => {
		for(const con of this.connections) {
			// Run each connect in async
			if (!con.Sync) {
				(async () => {
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
	Once = (callback: (...args : Params) => void | Promise<void>) => {
		const con = this.Connect(async (...args) => {
			con.Disconnect();
			await callback(...args);
		});
		return con;
	};
	
	Emit = this.Fire; // Alias for Fire
	On = this.Connect; // Alias for Connect
	
	/**
	 * Fires the signal and runs all the connections synchronously
	 * @param args The arguments to pass to the connections
	 */
	FireSync = async (...args : Params) => {
		for(const con of this.connections) {
			await con.Function(...args);
		}
	}
	
	/**
	 * Forces all connections to run asynchronously
	 * @param args The arguments to pass to the connections
	 */
	FireAsync = (...args : Params) => {
		for(const con of this.connections) {
			(async () => {
				con.Function(...args);
			})();
		}
	}
	
	/**
	 * Disconnects all connections to the signal
	 */
	DisconnectAll = () => {
		this.connections = [];
	}
	
	/**
	 * Wait for the signal to be fired
	 * @returns Promise that resolves when the signal is fired
	 */
	
	Wait = (): Promise<Params> => {
		return new Promise((resolve) => {
			const con = this.Connect((...args) => {
				con.Disconnect();
				resolve(args);
			});
		});
	}
}





export default Signal;
