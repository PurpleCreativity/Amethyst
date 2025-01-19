import SlashCommand from "../../classes/components/SlashCommand.js";
import client from "../../main.js";
import { CommandModule } from "../../types/core/Interactables.js";

export default new SlashCommand({
    name: "stats",
    description: "Get the bot stats",
    module: CommandModule.Global,

    userApp: true,

    function: async (interaction) => {
        if (!client.user || client.uptime === null) throw new Error("Client is not ready yet");

        const botOwner = await client.users.fetch("762329291169857537");

        const embed = client.Functions.makeInfoEmbed({
            title: `Amethyst - v${client.config.version}`,
            thumbnail: client.user.displayAvatarURL(),
            footer: {
                text: `Maintained by @${botOwner.username}`,
                iconURL: botOwner.displayAvatarURL(),
            },
            fields: [
                {
                    name: "Uptime",
                    value: `${Math.floor(client.uptime / 1000 / 60 / 60)} hours, ${Math.floor(client.uptime / 1000 / 60) % 60} minutes, ${Math.floor(client.uptime / 1000) % 60} seconds`,
                    inline: false,
                },
                {
                    name: "Memory Usage",
                    value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
                    inline: true,
                },
                {
                    name: "Bot Ping",
                    value: `${Math.floor(client.ws.ping)}ms`,
                    inline: true,
                },
                {
                    name: "Caches",
                    value: `${client.users.cache.size} users\n${client.channels.cache.size} channels\n${client.guilds.cache.size} guilds`,
                    inline: false,
                },
            ],
        });

        return await interaction.editReply({ embeds: [embed] });
    },
});
