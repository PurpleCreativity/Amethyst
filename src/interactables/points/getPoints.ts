import { SlashCommandStringOption } from "discord.js";
import ButtonEmbed from "../../classes/embeds/ButtonEmbed.js";
import { UserContextMenuCommand } from "../../classes/interactables/ContextCommand.js";
import SlashCommand from "../../classes/interactables/SlashCommand.js";
import client from "../../main.js";

const slashCommand = new SlashCommand({
    name: "getpoints",
    description: "View someone's points.",

    ephemeral: true,
    permissions: ["PointsViewer"],
    options: [
        new SlashCommandStringOption().setName("user").setDescription("The Roblox Username or Id.").setRequired(true),
    ],

    function: async (interaction, guildProfile) => {
        if (!guildProfile || !interaction.guild) throw new Error("Unknown error");
        const user = interaction.options.getString("user", true);

        const robloxProfile = await client.Functions.fetchRobloxUser(user);
        const guildUserProfile = await client.Database.getGuildUserProfile(interaction.guild.id, robloxProfile.id);
        const pendingPoints = await guildUserProfile.getPendingPoints();

        const embed = client.Functions.makeInfoEmbed({
            title: `${robloxProfile.username}'s points`,
            footer: {
                text: robloxProfile.username,
                iconURL: (
                    await client.noblox.getPlayerThumbnail(robloxProfile.id, "150x150", "png", true, "headshot")
                )[0].imageUrl,
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

const contextCommand = new UserContextMenuCommand({
    name: "Get Points",

    ephemeral: true,
    permissions: ["PointsViewer"],

    function: async (interaction, guildProfile) => {
        if (!guildProfile || !interaction.guild) throw new Error("Unknown error");

        const userProfile = await client.Database.getUserProfile(interaction.targetId);
        if (!userProfile.roblox.id) {
            return await interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "Get Points",
                        description: `<@${interaction.targetId}> is not linked to a Roblox account`,
                    }),
                ],
            });
        }

        const robloxProfile = await client.Functions.fetchRobloxUser(userProfile.roblox.id);
        const guildUserProfile = await client.Database.getGuildUserProfile(interaction.guild.id, userProfile.roblox.id);
        const pendingPoints = await guildUserProfile.getPendingPoints();

        const buttonEmbed = new ButtonEmbed(
            client.Functions.makeInfoEmbed({
                title: `${robloxProfile.username}'s points`,
                footer: {
                    text: robloxProfile.username,
                    iconURL: (
                        await client.noblox.getPlayerThumbnail(userProfile.roblox.id, "150x150", "png", true, "headshot")
                    )[0].imageUrl,
                },
            }),
        );

        buttonEmbed.Embed.addFields({
            name: guildProfile.shortname,
            value: `${guildUserProfile.points} points${pendingPoints !== 0 ? `(${pendingPoints} pending)` : ""}${guildUserProfile.ranklock.rank !== 0 ? "**Ranklocked**" : ""}`,
            inline: false,
        });

        return await interaction.editReply(buttonEmbed.getMessageData());
    },
});

export default [slashCommand, contextCommand];
