import { SlashCommandStringOption } from "discord.js";
import Plugin from "../../classes/Plugin.js";
import SlashCommand from "../../classes/interactables/SlashCommand.js";

export default new Plugin({
    name: "capeId",
    version: "1.0.0",
    author: "@purple_creativity",

    Init: async (client) => {
        client.Interactables.addCommand(
            new SlashCommand({
                name: "capeid",
                description: "Returns the image Id of the passed asset Id",

                userApp: true,
                ephemeral: true,

                options: [
                    new SlashCommandStringOption()
                        .setName("assetid")
                        .setDescription("The asset id to get the image id of")
                        .setRequired(true),
                ],

                function: async (interaction) => {
                    const assetId = interaction.options.getString("assetid", true);

                    const rbxRequest = await client.Axios.get(
                        `https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`,
                    );
                    const image = await client.Axios.get(
                        `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png&isCircular=false`,
                    );
                    const imageId = /(\d+)<\/url>/.exec(rbxRequest.data)?.[1];

                    return await interaction.editReply({
                        embeds: [
                            client.Functions.makeInfoEmbed({
                                title: "Cape Id",
                                description: `The image Id of asset Id [${assetId}](https://www.roblox.com/catalog/${assetId}) is __**[${imageId}](https://www.roblox.com/catalog/${imageId})**__`,
                                image: image.data.data[0].imageUrl,
                            }),
                        ],
                    });
                },
            }),
        );
    },
});
