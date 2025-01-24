import { SlashCommandStringOption, SlashCommandUserOption } from "discord.js";
import SlashCommand from "../../classes/components/SlashCommand.js";
import client from "../../main.js";
import { CommandModule } from "../../types/core/Interactables.js";

export default new SlashCommand({
    name: "forcelink",
    description: "edit this later",
    module: CommandModule.Developer,

    ephemeral: true,
    devOnly: true,
    userApp: true,

    options: [
        new SlashCommandUserOption().setName("target").setDescription("ok").setRequired(true),

        new SlashCommandStringOption().setName("roblox-searcher").setDescription("yap").setRequired(true),
    ],

    function: async (interaction) => {
        const robloxUser = await client.Functions.fetchRobloxUser(
            interaction.options.getString("roblox-searcher", true),
        );
        if (!robloxUser) {
            await interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "Forcelink",
                        description: "User not found.",
                    }),
                ],
            });
            return;
        }

        const discordUser = interaction.options.getUser("target", true);
        const userProfile = await client.Database.getUserProfile(discordUser.id);
        userProfile.roblox.id = robloxUser.id;
        userProfile.roblox.username = robloxUser.name;
        await userProfile.save();

        await interaction.editReply({
            embeds: [
                client.Functions.makeSuccessEmbed({
                    title: "Link successful",
                    description: `<@${discordUser.id}>'s account has been linked to \`${robloxUser.name}:${robloxUser.id}\``,
                }),
            ],
        });
    },
});
