import SlashCommand from "../../classes/SlashCommand.js";

export default new SlashCommand({
    name: "test",
    description: "Test command",

    defer: true,
    userApp: true,
    devOnly: true,

    execute: async (interaction) => {
        await interaction.editReply("Test command works!");
    }
})