import type { UserData } from "bloxwrap";
import {
    type APIEmbedField,
    ButtonStyle,
    type ChatInputCommandInteraction,
    SlashCommandStringOption,
    type UserContextMenuCommandInteraction,
} from "discord.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };
import Button from "../../classes/components/Button.js";
import ButtonEmbed from "../../classes/components/ButtonEmbed.js";
import PageEmbed from "../../classes/components/PageEmbed.js";
import type GuildProfile from "../../classes/database/GuildProfile.js";
import type { noteData } from "../../classes/database/GuildUser.js";
import type GuildUser from "../../classes/database/GuildUser.js";
import { UserContextMenuCommand } from "../../classes/interactables/ContextCommand.js";
import SlashCommand from "../../classes/interactables/SlashCommand.js";
import client from "../../main.js";

const callback = async (
    interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction,
    guildProfile: GuildProfile,
    guildUserProfile: GuildUser,
    robloxProfile: UserData,
) => {
    const pendingPoints = await guildUserProfile.fetchPendingPoints();
    const avatarHeadshot = await client.Functions.fetchRobloxUserAvatarHeadshot(robloxProfile.id);

    const buttonEmbed = new ButtonEmbed(
        client.Functions.makeInfoEmbed({
            title: `${robloxProfile.name}'s points`,
            footer: {
                text: robloxProfile.name,
                iconURL: avatarHeadshot,
            },
        }),
    );

    buttonEmbed.embed.addFields({
        name: guildProfile.shortname,
        value: `${guildUserProfile.points} points${pendingPoints !== 0 ? `(${pendingPoints} pending)` : ""}${guildUserProfile.ranklock.rank !== 0 ? "**Ranklocked**" : ""}`,
        inline: false,
    });

    buttonEmbed.addButton(
        new Button({
            label: "View Notes",
            emoji: Emojis.folder_open,
            style: ButtonStyle.Secondary,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                await buttonInteraction.deferReply({ ephemeral: true });

                let fields: APIEmbedField[] = guildUserProfile.notes.map((note: noteData) => ({
                    name: `\`${note.id}\``,
                    value: `Added by <@${note.creatorId}>, on <t:${Math.floor(note.createdAt.getTime() / 1000)}:f>\n\n\`\`\`${note.content.slice(0, 500)}${note.content.length > 500 ? "..." : ""}\`\`\``,
                    inline: false,
                }));

                if (fields.length === 0)
                    fields = [{ name: "No data", value: "This user doesn't have any notes.", inline: false }];

                const pageEmbed = new PageEmbed({
                    baseEmbed: client.Functions.makeInfoEmbed({
                        title: `${robloxProfile.name}'s notes`,
                    }),

                    fieldsPerPage: 5,
                    fields: fields,
                });

                pageEmbed.nextRow();

                pageEmbed.addButton(
                    new Button({
                        label: "Add Entry",
                        emoji: Emojis.add,
                        style: ButtonStyle.Success,
                        allowedUsers: [interaction.user.id],
                    }),
                );

                pageEmbed.addButton(
                    new Button({
                        label: "Remove Current Entry",
                        emoji: Emojis.delete,
                        style: ButtonStyle.Danger,
                        allowedUsers: [interaction.user.id],
                    }),
                );

                return await buttonInteraction.editReply(pageEmbed.getMessageData());
            },
        }),
    );

    buttonEmbed.addButton(
        new Button({
            label: "View Ranklock data",
            emoji: Emojis.description,
            style: ButtonStyle.Secondary,
            allowedUsers: [interaction.user.id],
            disabled: true, //! To be done at a later date

            function: async (buttonInteraction) => {},
        }),
    );

    return await interaction.editReply(buttonEmbed.getMessageData());
};

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

        return await callback(interaction, guildProfile, guildUserProfile, robloxProfile);
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

        return await callback(interaction, guildProfile, guildUserProfile, robloxProfile);
    },
});

export default [slashCommand, contextCommand];
