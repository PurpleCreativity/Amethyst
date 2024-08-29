import { GatewayIntentBits } from "discord.js";
import SuperClient from "./classes/SuperClient.js";

const client = new SuperClient({
    intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessages,
	]
})

client.Startup();

client.Threader.CreateThread("MemoryUsage", async () => {
	const used = client.Functions.MemoryUsage();
	// Calculate the used percentage of the total memory (512mb)
	client.MemoryUsage.push(used);
	const percentage = Math.round((used / 512) * 100);
	if (percentage > 80) {
		client.warn(`Memory usage is at ${percentage}%`);
	}
	client.verbose(`Memory usage is at ${used}MB (${percentage}%)`);
}).Loop(1000 * 10);

export default client;