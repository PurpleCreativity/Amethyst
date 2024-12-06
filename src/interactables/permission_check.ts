import SlashCommand from "../classes/interactables/SlashCommand.js";

export default new SlashCommand({
    name: "perm_test",
    description: "Debug, ignore",

    function: async (interaction, guildProfile) => {
        console.log(interaction, guildProfile);
    },
});
