import { type APIEmbedField, ButtonStyle, SlashCommandStringOption } from "discord.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };
import type { noteData } from "../../classes/database/GuildUser.js";
import ButtonEmbed from "../../classes/embeds/ButtonEmbed.js";
import PageEmbed from "../../classes/embeds/PageEmbed.js";
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
        const avatarHeadshot = (
            await client.noblox.getPlayerThumbnail(robloxProfile.id, "150x150", "png", true, "headshot")
        )[0].imageUrl;

        const buttonEmbed = new ButtonEmbed(
            client.Functions.makeInfoEmbed({
                title: `${robloxProfile.username}'s points`,
                footer: {
                    text: robloxProfile.username,
                    iconURL: avatarHeadshot,
                },
            }),
        );

        buttonEmbed.Embed.addFields({
            name: guildProfile.shortname,
            value: `${guildUserProfile.points} points${pendingPoints !== 0 ? `(${pendingPoints} pending)` : ""}${guildUserProfile.ranklock.rank !== 0 ? "**Ranklocked**" : ""}`,
            inline: false,
        });

        buttonEmbed.addButton({
            label: "View Notes",
            emoji: Emojis.folder_open,
            style: ButtonStyle.Secondary,
            allowed_users: [interaction.user.id],

            function: async (buttonInteraction) => {
                await buttonInteraction.deferReply({ ephemeral: true });

                let fields: APIEmbedField[] = guildUserProfile.notes.map((note: noteData) => ({
                    name: `\`${note.id}\``,
                    value: `Added by [${note.creatorId}](https://discord.com/users/${note.creatorId}), on <t:${Math.floor(note.createdAt.getTime() / 1000)}:f>\n\nContent: \`${note.content.slice(0, 500)}\`${note.content.length > 500 ? "..." : ""}`,
                    inline: false,
                }));

                if (fields.length === 0)
                    fields = [{ name: "No data", value: "This user doesn't have any notes.", inline: false }];

                const pageEmbed = new PageEmbed({
                    baseEmbed: client.Functions.makeInfoEmbed({
                        title: `${robloxProfile.username}'s notes`,
                    }),
                    fields: fields,
                });

                return await buttonInteraction.editReply(pageEmbed.getMessageData());
            },
        });

        buttonEmbed.addButton({
            label: "View Ranklock data",
            emoji: Emojis.description,
            style: ButtonStyle.Secondary,
            allowed_users: [interaction.user.id],
            disabled: true, //! To be done at a later date

            function: async (buttonInteraction) => {},
        });

        return await interaction.editReply(buttonEmbed.getMessageData());
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
        const avatarHeadshot = (
            await client.noblox.getPlayerThumbnail(userProfile.roblox.id, "150x150", "png", true, "headshot")
        )[0].imageUrl;

        const buttonEmbed = new ButtonEmbed(
            client.Functions.makeInfoEmbed({
                title: `${robloxProfile.username}'s points`,
                footer: {
                    text: robloxProfile.username,
                    iconURL: avatarHeadshot,
                },
            }),
        );

        buttonEmbed.Embed.addFields({
            name: guildProfile.shortname,
            value: `${guildUserProfile.points} points${pendingPoints !== 0 ? `(${pendingPoints} pending)` : ""}${guildUserProfile.ranklock.rank !== 0 ? "**Ranklocked**" : ""}`,
            inline: false,
        });

        buttonEmbed.addButton({
            label: "View Notes",
            emoji: Emojis.folder_open,
            style: ButtonStyle.Secondary,
            allowed_users: [interaction.user.id],

            function: async (buttonInteraction) => {
                await buttonInteraction.deferReply({ ephemeral: true });

                let fields: APIEmbedField[] = guildUserProfile.notes.map((note: noteData) => ({
                    name: `\`${note.id}\``,
                    value: `Added by <@${note.creatorId}>, on <t:${Math.floor(note.createdAt.getTime() / 1000)}:f>\n\nContent: \`${note.content.slice(0, 500)}\`${note.content.length > 500 ? "..." : ""}`,
                    inline: false,
                }));

                if (fields.length === 0)
                    fields = [{ name: "No data", value: "This user doesn't have any notes.", inline: false }];

                const pageEmbed = new PageEmbed({
                    baseEmbed: client.Functions.makeInfoEmbed({
                        title: `${robloxProfile.username}'s notes`,
                    }),
                    fields: fields,
                });

                return await buttonInteraction.editReply(pageEmbed.getMessageData());
            },
        });

        buttonEmbed.addButton({
            label: "View Ranklock data",
            emoji: Emojis.description,
            style: ButtonStyle.Secondary,
            allowed_users: [interaction.user.id],
            disabled: true, //! To be done at a later date

            function: async (buttonInteraction) => {},
        });

        return await interaction.editReply(buttonEmbed.getMessageData());
    },
});

export default [slashCommand, contextCommand];
