import { SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import userProfile from "../../schemas/userProfile.js";

export default new SlashCommand({
    name: "my",
    description: "Commands related to you within' the bot",

    defer: true,
    userApp: true,

    subcommands: [
        new SlashCommandSubcommandGroupBuilder()
            .setName("data")
            .setDescription("Manage your data")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("export")
                    .setDescription("Export your stored data")
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("clear")
                    .setDescription("Clear your stored data")
            )
        ,

        /*
        new SlashCommandSubcommandGroupBuilder()
            .setName("settings")
            .setDescription("Manage your settings")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("view")
                    .setDescription("View your settings")
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("set")
                    .setDescription("Set a setting to the given value")
                    .addStringOption((option) =>
                        option
                            .setName("setting")
                            .setDescription("The setting to set")
                            .setRequired(true)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("value")
                            .setDescription("The value to set the setting to")
                            .setRequired(true)
                    )
            )
        ,
        */
    ],

    execute: async (interaction) => {
        const subcommandGroup = interaction.options.getSubcommandGroup(true);
        const subcommand = interaction.options.getSubcommand(true);

        const userDataProfile = await client.Database.GetUserProfile(interaction.user.id, false);

        switch (subcommandGroup) {
            case "data": {
                switch (subcommand) {
                    case "clear": {
                        try {
                            await userProfile.deleteOne({ "user.id": interaction.user.id })

                            interaction.editReply({ embeds: [
                                client.Functions.makeSuccessEmbed({
                                    title: "Data Cleared",
                                    description: "All of your data associated with the bot has been erased (not including guild-related data)"
                                })
                            ]})
                        } catch (error) {
                            interaction.editReply({ embeds: [
                                client.Functions.makeErrorEmbed({
                                    title: "Error",
                                    description: "An error occured"
                                })
                            ]})
                        }

                        break;
                    }

                    case "export": {
                        const sendData = {
                            user: userDataProfile.user,
                            roblox: userDataProfile.roblox,
                            settings: userDataProfile.settings,
                        }

                        try {
                            await interaction.user.send({ content: "Below attached is your stored data", files: [{ attachment: Buffer.from(JSON.stringify(sendData, null, 4)), name: "data.json" }] });
                
                            await interaction.editReply({ embeds: [
                                client.Functions.makeSuccessEmbed({
                                    title: "Check your DMs!",
                                    description: "Check your DMs for the exported data."
                                })
                            ] });   
                        } catch (error) {
                            await interaction.editReply({ embeds: [
                                client.Functions.makeErrorEmbed({
                                    title: "Error",
                                    description: "I couldn't send you a DM. Please enable DMs from server members and try again."
                                })
                            ] })
                        }

                        break;
                    }
                }

                break;
            }

            case "settings": {
                break;
            }
        }
    }
})