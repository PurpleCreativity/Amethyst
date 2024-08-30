import { SlashCommandStringOption, SlashCommandUserOption } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";

export default new SlashCommand({
    name: "forcelink",
    description: "Forces a user to link their roblox account",

    defer: true,
    userApp: true,
    devOnly: true,

    options: [
        new SlashCommandUserOption()
            .setName("user")
            .setDescription("The user to force link")
            .setRequired(true)
        ,

        new SlashCommandStringOption()
            .setName("searcher")
            .setDescription("The username or id of the user")
            .setRequired(true)
    ],

    execute: async (interaction) => {
        const user = interaction.options.getUser("user", true);
        const searcher = interaction.options.getString("searcher", true);
        const robloxUser = await client.Functions.GetRobloxUser(searcher);
        if (!robloxUser) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Force Link", description: "User not found" })] });

        const userDataProfile = await client.Database.GetUserProfile(user.id, false);
        await userDataProfile.linkRoblox(robloxUser);

        return interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Force Link", description: `Linked \`${robloxUser.name}\`:\`${robloxUser.id}\` to <@${user.id}>`, thumbnail: await robloxUser.fetchUserHeadshotUrl() })] });
    }
})