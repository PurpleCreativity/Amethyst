import { ButtonStyle, SlashCommandStringOption } from "discord.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import { UserContextMenuCommand } from "../../classes/ContextCommand.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../main.js";
import type { guildProfileInterface } from "../../schemas/guildProfile.js";

const fullDataEmbed = async (guildProfile: guildProfileInterface, robloxUser: { id: string; name: string }) => {
    const user = await guildProfile.getUser(robloxUser.id.toString());
    const iconURL = (
        await client.noblox.getPlayerThumbnail(Number.parseInt(robloxUser.id), "150x150", "png", true, "headshot")
    )[0].imageUrl;

    const pendingPoints = guildProfile.calculatePendingPoints(robloxUser.id.toString());
    const groupRole = guildProfile.roblox.groupId && user.ranklock.rank !== 0 ? await client.Functions.getGroupRoleByRank(Number.parseInt(guildProfile.roblox.groupId), user.ranklock.rank) : undefined;

    return client.Functions.makeInfoEmbed({
        title: "Full Data",
        footer: { text: robloxUser.name, iconURL: iconURL },
        fields: [
            {
                name: "Points",
                value: `${user.points} points${pendingPoints !== 0 ? ` (${pendingPoints} pending)` : ""}`,
                inline: false,
            },
            {
                name: "Notes",
                value: `
                **Visible:** \`${user.note.visible}\`
                **Text:** ${user.note.content !== "" ? `\`${user.note.content}\`` : "`N/A`"}
                `,
            },
            {
                name: "Ranklock",
                value: `
                **Shadow:** \`${user.ranklock.shadow}\`
                **Reason:** ${user.ranklock.reason && user.ranklock.reason !== "" ? `\`${user.ranklock.reason}\`` : "`N/A`"}
                **Rank:** ${groupRole ? `\`${groupRole.name}\`:\`${groupRole.rank}\`` : "`Not ranklocked`"}
                `,
            },
        ],
    });
};

const slashCommand = new SlashCommand({
    name: "getpoints",
    description: "View the points and related data of a user",

    permissions: ["PointsViewer"],

    options: [
        new SlashCommandStringOption()
            .setName("user")
            .setDescription("The username or Id roblox of the target user")
            .setRequired(true),
    ],

    function: async (interaction, guildProfile) => {
        if (!guildProfile) throw new Error("No guild profile found.");

        const userInput = interaction.options.getString("user", true);
        const robloxUser = await client.Functions.fetchRobloxUser(userInput);
        if (!robloxUser) {
            await interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "View Points",
                        description: "User not found.",
                    }),
                ],
            });
            return;
        }

        const user = await guildProfile.getUser(robloxUser.id.toString());
        const pendingPoints = guildProfile.calculatePendingPoints(robloxUser.id.toString());
        const hasModAction = user.ranklock.rank !== 0 && !user.ranklock.shadow;

        const iconURL = (await client.noblox.getPlayerThumbnail(robloxUser.id, "150x150", "png", true, "headshot"))[0]
            .imageUrl;

        const buttonEmbed = new ButtonEmbed(
            client.Functions.makeInfoEmbed({
                title: "View Points",
                description: hasModAction
                    ? "*A moderation action is associated with one or more of these records*."
                    : undefined,
                footer: { text: `@${robloxUser.username}`, iconURL: iconURL },
                fields: [
                    {
                        name: guildProfile.shortname,
                        value: `${user.points} points${pendingPoints !== 0 ? ` (${pendingPoints} pending)` : ""}`,
                        inline: true,
                    },
                ],
            }),
        );

        buttonEmbed.addButton({
            label: "View Full Data",
            style: ButtonStyle.Secondary,
            emoji: Emojis.folder_open,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                await buttonInteraction.deferReply({ ephemeral: true });

                return await buttonInteraction.editReply({
                    embeds: [
                        await fullDataEmbed(guildProfile, { name: robloxUser.username, id: robloxUser.id.toString() }),
                    ],
                });
            },
        });

        return await interaction.editReply(buttonEmbed.getMessageData());
    },
});

const userCommand = new UserContextMenuCommand({
    name: "Get Points",

    permissions: ["PointsViewer"],

    function: async (interaction, guildProfile) => {
        if (!guildProfile) throw new Error("No guild profile found.");

        const linkedUser = await client.Functions.getLinkedRobloxUser(interaction.targetId);
        if (!linkedUser) {
            await interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "View Points",
                        description: "This user is not linked to a Roblox account.",
                    }),
                ],
            });
            return;
        }

        const user = await guildProfile.getUser(linkedUser.id);
        const pendingPoints = guildProfile.calculatePendingPoints(linkedUser.id);
        const hasModAction = user.ranklock.rank !== 0 && !user.ranklock.shadow;

        const iconURL = (
            await client.noblox.getPlayerThumbnail(Number.parseInt(linkedUser.id), "150x150", "png", true, "headshot")
        )[0].imageUrl;

        const buttonEmbed = new ButtonEmbed(
            client.Functions.makeInfoEmbed({
                title: "View Points",
                description: hasModAction
                    ? "*A moderation action is associated with one or more of these records*."
                    : undefined,
                footer: { text: `@${linkedUser.name}`, iconURL: iconURL },
                fields: [
                    {
                        name: guildProfile.shortname,
                        value: `${user.points} points${pendingPoints !== 0 ? ` (${pendingPoints} pending)` : ""}`,
                        inline: true,
                    },
                ],
            }),
        );

        buttonEmbed.addButton({
            label: "View Full Data",
            style: ButtonStyle.Secondary,
            emoji: Emojis.folder_open,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                await buttonInteraction.deferReply({ ephemeral: true });

                return await buttonInteraction.editReply({
                    embeds: [await fullDataEmbed(guildProfile, linkedUser)],
                });
            },
        });

        return await interaction.editReply(buttonEmbed.getMessageData());
    },
});

export default [slashCommand, userCommand];
