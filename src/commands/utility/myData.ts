import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";

export default new SlashCommand({
    name: "mydata",
    description: "View your data",

    defer: false,
    userApp: true,
    userCooldown: 10 * 60000,

    execute: async (interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const userData = await client.Database.GetUserProfile(interaction.user.id, false);

        const sendData = {
            user: userData.user,
            roblox: userData.roblox,
            settings: userData.settings,
        }

        try {
            await interaction.user.send({ content: "Below attached is your stored data", files: [{ attachment: Buffer.from(JSON.stringify(sendData)), name: "data.json" }] });

            await interaction.editReply("Check your DMs!");   
        } catch (error) {
            await interaction.editReply("I couldn't send you a DM. Please enable DMs from server members and try again.");
        }
    }
})