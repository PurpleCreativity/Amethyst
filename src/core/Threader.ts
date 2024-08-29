import type SuperClient from "../classes/SuperClient.js";
import Signal from "../classes/Signal.js";

export class Thread<V extends (...args : any[]) => any> {
	Name : string;
	RawFunction : V;
	Running = false;
	Active = true;
	private Looped = false;
	Threader : Threader;
	Id = crypto.randomUUID();
	client : SuperClient;
	Interval = 0;
	
	Resumed = new Signal();
	Finished = new Signal();
	
	constructor(Threader : Threader, name : string, func : V) {
		this.Name = name;
		this.RawFunction = func;
		this.Threader = Threader;
		this.client = Threader.client;
	};
	
	/**
	 * Runs the thread for a single iteration
	 * @param args The arguments to pass to the function
	 * @returns Promise that resolves when the function is done running
	 */
	Run = (...args : Parameters<V>) => {
		this.Active = true;
		return (async() => {
			await this.RawFunction(...args);
			this.Finished.Fire()
		})()
		
	}
	
	/**
	 * Runs the thread in a loop until its halted
	 * @param interval How long to wait between each iteration
	 * @param args The arguments to pass to the function
	 * @returns self
	 */
	Loop = (interval : number, ...args : Parameters<V>) => {
		this.Looped = true;
		this.Active = true;
		this.Running = true;
		this.Interval = interval;
		(async() => {
			while (this.Active) {
				if (!this.Running) {
					await this.Resumed.Wait();
				}
				await this.RawFunction(...args);
				await this.Finished.Fire();
				await new Promise((res) => {
					setTimeout(res, this.Interval);
				})
			}
		})()
		return this;
	};
	
	/**
	 * Halts the thread if its looped
	 */
	
	Halt = () => {
		this.Running = false;
	}
	
	/**
	 * Halts the thread for a certain amount of time
	 * @param time How long to halt the thread for
	 */
	
	HaltFor = async (time : number) => {
		this.Halt();
		await new Promise((res) => {
			setTimeout(res, time);
		})
		this.Resume();
		
	}
	
	/**
	 * Resumes the thread if its halted
	 */
	
	Resume = () => {
		this.Running = true;
		this.Resumed.Fire();
	}
	
	End = () => {
		/**
		 * Ends the thread if its looped
		 */
		this.Active = false;
	}
	
	IsLooped = () => {
		return this.Looped;
	}
	
	/**
	 * Destroys the thread
	 */
	Destroy = () => {
		this.End();
		this.Threader.Threads = this.Threader.Threads.filter((thread) => thread !== this);
		// Destroy this thread
		for (const key in this) {
			delete this[key];
		}
	}
}


class Threader {
	client : SuperClient;
	Threads = [] as Thread<any>[];
	
	private Thread = Thread;
	
	constructor(client : SuperClient) {
		this.client = client;
	}

	Init = async () => {
		this.client.success("Initialized Threader");
	}
	
	CreateThread = <V extends (...args : any[]) => any>(name : string, func : V) => {
		const thread = new this.Thread(this, name, func);
		this.Threads.push(thread);
		return thread;
	}
	
	GetThreadByName = (name : string) => {
		return this.Threads.find((thread) => thread.Name === name);
	}
	
	GetThreadById = (id : string) => {
		return this.Threads.find((thread) => thread.Id === id);
	}
	
	GetThread = (nameOrId : string) => {
		return this.GetThreadById(nameOrId) || this.GetThreadByName(nameOrId);
	}
	
	EndAll = () => {
		for (const thread of this.Threads) {
			thread.End();
		}
	}
	
	DestroyAll = () => {
		for (const thread of this.Threads) {
			thread.Destroy();
		}
	}
	
	/**
	 * Halts all threads
	 */
	HaltAll = () => {
		for (const thread of this.Threads) {
			thread.Halt();
		}
	}

	CleanUp = () => {
		this.EndAll()
	}
}

export default Threader;
