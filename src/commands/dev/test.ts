import SlashCommand from "../../classes/SlashCommand.js";

const command = new SlashCommand({
    name: "test",
    description: "Test command",

    userApp: true,
    devOnly: true,

    execute: async (interaction) => {
        await interaction.reply("Test command works!");
    }
})

export default command;