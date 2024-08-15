import { SlashCommandSubcommandBuilder } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";

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
            .addNumberOption(option =>
                option
                    .setName("rank")
                    .setDescription("The rank to lock")
                    .setMinValue(1)
                    .setMaxValue(255)
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
                    .setDescription("Whether the user should be shadowranklocked")
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

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);
        const subcommand = interaction.options.getSubcommand(true);

        switch (subcommand) {
            case "set": {
                const user = interaction.options.getString("user", true);
                const rank = interaction.options.getNumber("rank", true);
                const reason = interaction.options.getString("reason", false);
                const shadow = interaction.options.getBoolean("shadow", false) ?? false;

                const robloxGroup = await guildDataProfile.fetchGroup();
                if (!robloxGroup) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Rank Lock", description: "Group not found" })], ephemeral: true });

                const role = await robloxGroup.fetchRoleByRank(rank);
                if (!role) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Rank Lock", description: "Role not found" })], ephemeral: true });

                const robloxUser = await client.Functions.GetRobloxUser(user);
                if (!robloxUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Rank Lock", description: "User not found" })], ephemeral: true });

                const guildUser = await guildDataProfile.getUser(robloxUser.id);
                guildUser.ranklock = {
                    rank: rank,
                    shadow: shadow,
                    reason: reason ?? "",

                    updatedAt: new Date(),
                };

                await guildDataProfile.save();

                return interaction.reply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Rank Lock", description: `Locked ${robloxUser.name}'s rank to \`${rank}\`` })], ephemeral: shadow });
            }

            case "remove": {
                const user = interaction.options.getString("user", true);

                const robloxUser = await client.Functions.GetRobloxUser(user);
                if (!robloxUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Rank Lock", description: "User not found" })], ephemeral: true });

                const guildUser = await guildDataProfile.getUser(robloxUser.id);
                guildUser.ranklock = {
                    rank: 0,
                    shadow: false,
                    reason: "",

                    updatedAt: new Date(),
                }

                await guildDataProfile.save();

                return interaction.reply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Rank Lock", description: `Unlocked ${robloxUser.name}'s rank` })], ephemeral: true });
            }
        }
    }
})

export default command;