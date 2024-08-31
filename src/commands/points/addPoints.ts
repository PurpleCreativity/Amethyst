import { SlashCommandNumberOption, SlashCommandStringOption } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";

export default new SlashCommand({
    name: "addpoints",
    description: "Adds points to a user",

    defer: true,
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
            .setDescription("The amount of points to add")
            .setRequired(true)
    ],

    execute: async (interaction, guildDataProfile) => {
        if (!interaction.guild || !guildDataProfile) return;

        const modifierUser = await client.Functions.GetLinkedRobloxUser(interaction.user.id);
        if (!modifierUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Add Points", description: "You are not linked to a Roblox account" })], ephemeral: true });

        const user = interaction.options.getString("user", true);
        const amount = interaction.options.getNumber("amount", true);

        const robloxUser = await client.Functions.GetRobloxUser(user);
        if (!robloxUser) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Add Points", description: "User not found" })] });

        const oldPoints = (await guildDataProfile.getUser(robloxUser.id)).points;

        await guildDataProfile.incrementPoints(robloxUser.id, amount, modifierUser);

        return interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({
            title: "Add Points",
            description: `Added \`${amount}\` points to [${robloxUser.name}](https://www.roblox.com/users/${robloxUser.id}/profile)`,
            footer: { text: robloxUser.name, iconURL: await robloxUser.fetchUserHeadshotUrl() },
            fields: [
                { name: "Old Points", value: `\`${oldPoints}\``, inline: true },
                { name: "New Points", value: `\`${oldPoints + amount}\``, inline: true },
            ]
        })] });
    }
})