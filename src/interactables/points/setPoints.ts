import { SlashCommandNumberOption, SlashCommandStringOption } from "discord.js";
import SlashCommand from "../../classes/interactables/SlashCommand.js";
import client from "../../main.js";

export default new SlashCommand({
    name: "setpoints",
    description: "Set a user's points to the given value.",

    permissions: ["PointsManager"],
    options: [
        new SlashCommandStringOption().setName("user").setDescription("The Roblox Username or Id.").setRequired(true),
        new SlashCommandNumberOption().setName("amount").setDescription("The new amount of points").setRequired(true),
    ],

    function: async (interaction, guildProfile) => {
        if (!guildProfile || !interaction.guild) throw new Error("Unknown error");
        const user = interaction.options.getString("user", true);
        const newAmount = Math.floor(interaction.options.getNumber("amount", true));

        const robloxProfile = await client.Functions.fetchRobloxUser(user);
        const guildUserProfile = await client.Database.getGuildUserProfile(interaction.guild.id, robloxProfile.id);
        const oldAmount = guildUserProfile.points;
        const avatarHeadshot = await client.Functions.fetchRobloxUserAvatarHeadshot(robloxProfile.id);

        guildUserProfile.points = newAmount;
        await guildUserProfile.save();

        return await interaction.editReply({
            embeds: [
                client.Functions.makeSuccessEmbed({
                    title: "Set points",
                    description: `Set ${robloxProfile.name}'s points`,
                    footer: { text: robloxProfile.name, iconURL: avatarHeadshot },
                    fields: [
                        { name: "Old Amount", value: `\`\`\`${oldAmount}\`\`\``, inline: true },
                        { name: "New Amount", value: `\`\`\`${newAmount}\`\`\``, inline: true },
                    ],
                }),
            ],
        });
    },
});
