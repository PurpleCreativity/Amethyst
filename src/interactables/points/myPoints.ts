import SlashCommand from "../../classes/interactables/SlashCommand.js";
import client from "../../main.js";

export default new SlashCommand({
    name: "mypoints",
    description: "View your points.",

    ephemeral: true,

    function: async (interaction, guildProfile) => {
        if (!guildProfile || !interaction.guild) throw new Error("Unknown error");

        const userProfile = await client.Database.getUserProfile(interaction.user.id);
        if (!userProfile.roblox.id) {
            return await interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "Your Points",
                        description: "You are not linked to a Roblox account",
                    }),
                ],
            });
        }

        const robloxProfile = await client.Functions.fetchRobloxUser(userProfile.roblox.id);
        const guildUserProfile = await client.Database.getGuildUserProfile(interaction.guild.id, userProfile.roblox.id);
        const pendingPoints = await guildUserProfile.fetchPendingPoints();
        const avatarHeadshot = await client.Functions.fetchRobloxUserAvatarHeadshot(robloxProfile.id);

        const embed = client.Functions.makeInfoEmbed({
            title: "Your points",
            footer: {
                text: robloxProfile.name,
                iconURL: avatarHeadshot,
            },
        });

        embed.addField(
            guildProfile.shortname,
            `${guildUserProfile.points} points${pendingPoints !== 0 ? `(${pendingPoints} pending)` : ""}${guildUserProfile.ranklock.rank !== 0 ? "**Ranklocked**" : ""}`,
            false,
        );

        return await interaction.editReply({ embeds: [embed] });
    },
});
