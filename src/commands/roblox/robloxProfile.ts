import { SlashCommandStringOption } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";

export default new SlashCommand({
    name: "robloxprofile",
    description: "Render a Roblox profile",

    userApp: true,
    devOnly: false,
    dmpermission: true,
    options: [
        new SlashCommandStringOption()
            .setName("user")
            .setDescription("The username or id of the Roblox user")
            .setRequired(true)
    ],

    execute: async (interaction) => {
        const user = interaction.options.getString("user", true);

        await interaction.deferReply();
        const actualUser = await client.Functions.GetRobloxUser(user);
        if (!actualUser) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "User not found", description: "Failed to get Roblox user" })] });

        interaction.editReply({ embeds: [client.Functions.makeInfoEmbed({
            title: actualUser.name,
            url: `https://www.roblox.com/users/${actualUser.id}/profile`,

            description: actualUser.description.slice(0, 2048),

            thumbnail: await actualUser.fetchUserHeadshotUrl(),
            image: await actualUser.fetchUserAvatarThumbnailUrl(),

            fields: [
                { name: "Username", value: `\`${actualUser.name}\``, inline: true },
                { name: "Display name", value: `\`${actualUser.displayName}\``, inline: true },
                { name: "Id", value: `\`${actualUser.id}\``, inline: true },

                { name: "Banned", value: `\`${actualUser.rawData.isBanned}\``, inline: true },
                { name: "Account age", value: `\`${Math.ceil(Math.abs(new Date().getTime() - new Date(actualUser.rawData.created).getTime()) / (1000 * 3600 * 24))}\` days`, inline: true },
                { name: "Join date", value: `<t:${Math.round(new Date(actualUser.rawData.created).getTime() / 1000)}:F>`, inline: true },
            ]
        })]});
    }
})