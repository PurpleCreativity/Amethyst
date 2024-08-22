import { SlashCommandSubcommandBuilder } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import type { Role } from "wrapblox";

const command = new SlashCommand({
    name: "ranklock",
    description: "Locks a user's rank",

    customPermissions: ["PointsManager"],
    module: "Points",
    subcommands: [
        new SlashCommandSubcommandBuilder()
            .setName("set")
            .setDescription("Locks a user's rank")
            .addStringOption(option =>
                option
                    .setName("user")
                    .setDescription("The username or id of the user")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("rank")
                    .setDescription("The rank name or id")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("reason")
                    .setDescription("The reason for the ranklock")
                    .setRequired(false)
            )
            .addBooleanOption(option =>
                option
                    .setName("shadow")
                    .setDescription("Whether the ranklock should be shadow")
                    .setRequired(false)
            )
        ,

        new SlashCommandSubcommandBuilder()
            .setName("remove")
            .setDescription("Unlocks a user's rank")
            .addStringOption(option =>
                option
                    .setName("user")
                    .setDescription("The username or id of the user")
                    .setRequired(true)
            )
    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const modifierUser = await client.Functions.GetLinkedRobloxUser(interaction.user.id);
        if (!modifierUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Add Points", description: "You are not linked to a Roblox account" })], ephemeral: true });

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);
        const subcommand = interaction.options.getSubcommand(true);

        switch (subcommand) {
            case "set": {
                const user = interaction.options.getString("user", true);
                const rank = interaction.options.getString("rank", true);
                const reason = interaction.options.getString("reason", false);
                const shadow = interaction.options.getBoolean("shadow", false) ?? false;

                const robloxGroup = await guildDataProfile.fetchGroup();
                if (!robloxGroup) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Manage Ranklock", description: "Group not found" })], ephemeral: true });

                let actualRole: Role | undefined;
                actualRole = await robloxGroup.fetchRoleByName(rank);
                if (!actualRole && !Number.isNaN(Number(rank))) actualRole = await robloxGroup.fetchRoleByRank(Number.parseFloat(rank));
                if (!actualRole) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Manage Ranklock", description: "Role not found" })], ephemeral: true });

                const robloxUser = await client.Functions.GetRobloxUser(user);
                if (!robloxUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Manage Ranklock", description: "User not found" })], ephemeral: true });

                await guildDataProfile.setRanklock(robloxUser.id, { rank: actualRole.rank, shadow, reason: reason || "No reason provided" }, modifierUser);

                return interaction.reply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Manage Ranklock", description: `Locked ${robloxUser.name}'s rank to \`${actualRole.name}\`:\`${actualRole.rank}\``, footer: { text: robloxUser.name, iconURL: await robloxUser.fetchUserHeadshotUrl() } })], ephemeral: shadow });
            }

            case "remove": {
                const user = interaction.options.getString("user", true);

                const robloxUser = await client.Functions.GetRobloxUser(user);
                if (!robloxUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Manage Ranklock", description: "User not found" })], ephemeral: true });

                await guildDataProfile.setRanklock(robloxUser.id, { rank: 0, shadow: false, reason: "" }, modifierUser);

                return interaction.reply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Manage Ranklock", description: `Unlocked ${robloxUser.name}'s rank`, footer: { text: robloxUser.name, iconURL: await robloxUser.fetchUserHeadshotUrl() } })], ephemeral: true });
            }
        }
    }
})

export default command;