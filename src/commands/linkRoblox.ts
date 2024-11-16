import { SlashCommandStringOption } from "discord.js";
import SlashCommand from "../classes/SlashCommand.js";
import client from "../main.js";

export default new SlashCommand({
    name: "linkroblox",
    description: "Link your Discord account to your Roblox account.",

    options: [
        new SlashCommandStringOption().setName("username").setDescription("Your Roblox username.").setRequired(true),
    ],

    function: async (interaction) => {},
});
