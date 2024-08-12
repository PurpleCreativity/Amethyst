import StaticButton from "../classes/StaticButton.js";

export default new StaticButton({
    customId: "pointlog",
    permissions: [],
    customPermissions: ["PointsManager"],

    execute: async (interaction) => {
        await interaction.reply({ content: "Points", ephemeral: true })
    }
})