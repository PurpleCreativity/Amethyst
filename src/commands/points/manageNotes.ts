import { SlashCommandSubcommandBuilder } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";

const command = new SlashCommand({
    name: "note",
    description: "Configure a user's notes",

    customPermissions: ["PointsManager"],
    subcommands: [
        new SlashCommandSubcommandBuilder()
            .setName("set")
            .setDescription("Sets a user's notes")
            .addStringOption(option =>
                option
                    .setName("user")
                    .setDescription("The username or id of the user")
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName("notes")
                    .setDescription("The notes to set")
                    .setMaxLength(500)
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option
                    .setName("visible")
                    .setDescription("Whether the notes should be visible")
                    .setRequired(false)
            )
        ,

        new SlashCommandSubcommandBuilder()
            .setName("clear")
            .setDescription("Clears a user's notes")
            .addStringOption(option =>
                option
                    .setName("user")
                    .setDescription("The username or id of the user")
                    .setRequired(true)
            )
        ,
    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const modifierUser = await client.Functions.GetLinkedRobloxUser(interaction.user.id);
        if (!modifierUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Manage Notes", description: "You are not linked to a Roblox account" })], ephemeral: true });

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);

        const subcommand = interaction.options.getSubcommand(true);
        switch (subcommand) {
            case "set": {
                const user = interaction.options.getString("user", true);
                const notes = interaction.options.getString("notes", true);
                const visible = interaction.options.getBoolean("visible") ?? true;

                const robloxUser = await client.Functions.GetRobloxUser(user);
                if (!robloxUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Manage Notes", description: "User not found" })], ephemeral: true });

                await guildDataProfile.setNotes(robloxUser.id, { text: notes, visible: visible }, modifierUser);

                await interaction.reply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Manage Notes", description: `Set notes for \`${robloxUser.name}\`:\`${robloxUser.id}\``, footer: { text: robloxUser.name, iconURL: await robloxUser.fetchUserHeadshotUrl() } })], ephemeral: !visible });

                break;
            }

            case "clear": {
                const user = interaction.options.getString("user", true);

                const robloxUser = await client.Functions.GetRobloxUser(user);
                if (!robloxUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Manage Notes", description: "User not found" })], ephemeral: true });

                await guildDataProfile.setNotes(robloxUser.id, { text: "", visible: true }, modifierUser);

                await interaction.reply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Manage Notes", description: `Cleared notes for \`${robloxUser.name}\`:\`${robloxUser.id}\``, footer: { text: robloxUser.name, iconURL: await robloxUser.fetchUserHeadshotUrl() } })] });

                break;
            }
        }        
    }
})

export default command;