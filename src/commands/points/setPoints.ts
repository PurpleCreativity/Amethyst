import { SlashCommandNumberOption, SlashCommandStringOption } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";

export default new SlashCommand({
    name: "setpoints",
    description: "Sets a user's points",

    module: "Points",
    customPermissions: ["PointsManager"],

    options: [
        new SlashCommandStringOption()
            .setName("user")
            .setDescription("The username or id of the user")
            .setRequired(true)
        ,

        new SlashCommandNumberOption()
            .setName("amount")
            .setDescription("The amount of points to set")
            .setRequired(true)
    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const modifierUser = await client.Functions.GetLinkedRobloxUser(interaction.user.id);
        if (!modifierUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Manage Notes", description: "You are not linked to a Roblox account" })], ephemeral: true });

        const user = interaction.options.getString("user", true);
        const amount = interaction.options.getNumber("amount", true);

        const robloxUser = await client.Functions.GetRobloxUser(user);
        if (!robloxUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Set Points", description: "User not found" })], ephemeral: true });

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);
        const oldPoints = (await guildDataProfile.getUser(robloxUser.id)).points;

        await guildDataProfile.setPoints(robloxUser.id, amount, modifierUser);

        return interaction.reply({ embeds: [client.Functions.makeSuccessEmbed({
            title: "Set Points",
            description: `Set [${robloxUser.name}](https://www.roblox.com/users/${robloxUser.id}/profile)'s points to \`${amount}\``,
            footer: { text: robloxUser.name, iconURL: await robloxUser.fetchUserHeadshotUrl() },
            fields: [
                { name: "Old Points", value: `\`${oldPoints}\``, inline: true },
                { name: "New Points", value: `\`${amount}\``, inline: true },
            ]
        })] });
    }
})