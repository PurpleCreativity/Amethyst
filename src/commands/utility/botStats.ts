import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";

const command = new SlashCommand({
    name: "stats",
    description: "Shows the bot statistics",

    userApp: true,

    execute: async (interaction) => {
        if (client.uptime === null || !client.user) throw new Error("Uptime is undefined");

        // Breaks on localhost
        const elapsed = await client.Functions.pcall(async () => {
            const startTime = new Date().getTime();
            await client.Axios.get(`${client.config.baseURL}/api/v1/healtcheck`);
            return new Date().getTime() - startTime || 0;
        })

        const embed = client.Functions.makeInfoEmbed({
            title: `Amethyst - v${client.config.version}`,
            thumbnail: client.user.displayAvatarURL(),
            fields: [
                {
                    name: "Uptime",
                    value: `${Math.floor(client.uptime / 1000 / 60 / 60)} hours, ${Math.floor(client.uptime / 1000 / 60) % 60} minutes, ${Math.floor(client.uptime / 1000) % 60} seconds`,
                    inline: false
                },
                {
                    name: "Memory Usage",
                    value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
                    inline: true
                },
                {
                    name: "Bot Ping",
                    value: `${Math.floor(client.ws.ping)} ms`,
                    inline: true
                },
                {
                    name: "Webserver Ping",
                    value: `${Math.floor(elapsed[0] as boolean ? elapsed[1] as number : 0)}ms`,
                    inline: true
                },
                {
                    name: "Caches",
                    value: `${client.users.cache.size} users\n${client.channels.cache.size} channels\n${client.guilds.cache.size} guilds`,
                    inline: false
                }
            ]
        });

        await interaction.reply({ embeds: [embed] });
    }
})

export default command;