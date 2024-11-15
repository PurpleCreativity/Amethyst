import { GatewayIntentBits } from "discord-api-types/v10";
import Client from "./classes/Client.js";

const client: Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessages,
    ],
});

await client.Startup();

const maxMemory = 512; // in MB
client.Threader.CreateThread("MemoryMonitor", () => {
    const used = client.Functions.MemoryUsage();

    const percentage = Math.ceil((used / maxMemory) * 100);
    if (percentage > 75) {
        client.warn(`Memory usage is at [${percentage}%] ${used}MB`);
    }

    client.verbose(`Memory usage is at [${percentage}%] ${used}MB`);
}).Loop(1 * 60 * 1000);

export default client;
