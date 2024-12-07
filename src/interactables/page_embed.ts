import type { APIEmbedField } from "discord.js";
import PageEmbed from "../classes/embeds/PageEmbed.js";
import SlashCommand from "../classes/interactables/SlashCommand.js";
import client from "../main.js";

export default new SlashCommand({
    name: "page_embed_test",
    description: "Test the page embed.",

    user_installable: true,

    function: async (interaction) => {
        const fields: APIEmbedField[] = Array.from({ length: 100 }, (_, i) => ({
            name: `Field ${i + 1}`,
            value: `This is the value for field ${i + 1}`,
            inline: true,
        }));

        const embed = new PageEmbed({ baseEmbed: client.Functions.makeInfoEmbed({ title: "Page Embed Test" }), fields: fields, allowed_users: [interaction.user.id] });

        return await interaction.editReply(embed.getMessageData());
    },
})