import { UserAvatarHeadshotImageSize, type UserData } from "bloxwrap";
import {
    ButtonStyle,
    type ChatInputCommandInteraction,
    SlashCommandStringOption,
    type UserContextMenuCommandInteraction,
} from "discord.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };
import Button from "../../classes/components/Button.js";
import ButtonEmbed from "../../classes/components/ButtonEmbed.js";
import { UserContextMenuCommand } from "../../classes/components/ContextMenuCommand.js";
import SlashCommand from "../../classes/components/SlashCommand.js";
import type GuildProfile from "../../classes/database/GuildProfile.js";
import type GuildUser from "../../classes/database/GuildUser.js";
import client from "../../main.js";
import { CommandModule, CommandPermission } from "../../types/core/Interactables.js";

const callback = async (
    interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction,
    guildProfile: GuildProfile,
    guildUserProfile: GuildUser,
    robloxProfile: UserData,
) => {
    const pendingPoints = await guildUserProfile.fetchPendingPoints();
    const avatarHeadshot = await client.Functions.fetchRobloxUserAvatarHeadshot(
        robloxProfile.id,
        UserAvatarHeadshotImageSize["48x48"],
        true,
    );

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
        value: `${guildUserProfile.points} points${pendingPoints !== 0 ? ` (${pendingPoints} pending)` : ""}${guildUserProfile.ranklock.rank !== 0 ? "**Ranklocked**" : ""}`,
        inline: false,
    });

    buttonEmbed.addButton(
        new Button({
            label: "View Ranklock data",
            emoji: Emojis.description,
            style: ButtonStyle.Secondary,
            allowedUsers: [interaction.user.id],
            disabled: true, //! To be done at a later date
        }),
    );

    return await interaction.editReply(buttonEmbed.getMessageData());
};

const slashCommand = new SlashCommand({
    name: "getpoints",
    description: "View someone's points.",
    module: CommandModule.Points,

    ephemeral: true,
    permissions: [CommandPermission.PointsViewer],
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
    module: CommandModule.Points,

    ephemeral: true,
    permissions: [CommandPermission.PointsViewer],

    function: async (interaction, guildProfile) => {
        if (!guildProfile || !interaction.guild) throw new Error("Unknown error");

        const userProfile = await client.Database.getUserProfile(interaction.targetId);
        if (!userProfile.roblox.id) {
            await interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "Get Points",
                        description: `<@${interaction.targetId}> is not linked to a Roblox account`,
                    }),
                ],
            });
            return;
        }

        const robloxProfile = await client.Functions.fetchRobloxUser(userProfile.roblox.id);
        const guildUserProfile = await client.Database.getGuildUserProfile(interaction.guild.id, userProfile.roblox.id);

        await callback(interaction, guildProfile, guildUserProfile, robloxProfile);
    },
});

export default [slashCommand, contextCommand];
