import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../main.js";

export default new SlashCommand({
    name: "mypoints",
    description: "Check your points",

    function: async (interaction, guildProfile) => {
        if (!guildProfile) throw new Error("No guild profile found.");

        const linkedUser = await client.Functions.getLinkedRobloxUser(interaction.user.id);
        if (!linkedUser) {
            await interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "My Points",
                        description: "You are not linked to a Roblox account.",
                    }),
                ],
            });
            return;
        }

        const user = await guildProfile.getUser(linkedUser.id);
        const pendingPoints = guildProfile.calculatePendingPoints(linkedUser.id);
        const iconURL = (
            await client.noblox.getPlayerThumbnail(Number.parseInt(linkedUser.id), "150x150", "png", true, "headshot")
        )[0].imageUrl;

        return await interaction.editReply({
            embeds: [
                client.Functions.makeInfoEmbed({
                    title: "My Points",
                    footer: { text: `@${linkedUser.name}`, iconURL: iconURL },
                    fields: [
                        {
                            name: guildProfile.shortname,
                            value: `${user.points} points${pendingPoints !== 0 ? ` (${pendingPoints} pending)` : ""}`,
                        },
                    ],
                }),
            ],
        });
    },
});
