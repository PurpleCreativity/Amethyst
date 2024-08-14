import { SlashCommandStringOption } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";

type avatarAsset = {
    id: number,
    name: string,
    assetType: {
        id: number,
        name: string
    },
    currentVersionId: string
}

const command = new SlashCommand({
    name: "charalias",
    description: "Get a user's character alias",

    userApp: true,
    userCooldown: 60000,

    options: [
        new SlashCommandStringOption()
            .setName("username")
            .setDescription("The username of the user")
            .setRequired(true)
    ],

    execute: async (interaction) => {
        const username = interaction.options.getString("username", true);
        const robloxUser = await client.Functions.GetRobloxUser(username);
        if (!robloxUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Character Alias", description: "User not found" })], ephemeral: true });
        
        const avatarData = await client.Axios.get(`https://avatar.roblox.com/v2/avatar/users/${robloxUser.id}/avatar`);

        const assets = avatarData.data.assets;

        const hats = assets.filter((asset: avatarAsset) => (
            asset.assetType.name === "Hat" ||
            asset.assetType.name === "WaistAccessory" ||
            asset.assetType.name === "NeckAccessory" ||
            asset.assetType.name === "ShoulderAccessory" ||
            asset.assetType.name === "FrontAccessory" ||
            asset.assetType.name === "BackAccessory" ||
            asset.assetType.name === "FaceAccessory" || 
            asset.assetType.name === "HairAccessory"
        ));

        const face = assets.find((asset: avatarAsset) => asset.assetType.name === "Face");
        const shirt = assets.find((asset: avatarAsset) => asset.assetType.name === "Shirt");
        const pants = assets.find((asset: avatarAsset) => asset.assetType.name === "Pants");
        const tshirt = assets.find((asset: avatarAsset) => asset.assetType.name === "TShirt");


        let aliasString = "";
        let untilRatelimit = 5;

        for (const hat of hats) {
            untilRatelimit--;
            aliasString += `!hat ${hat.id} | `;
                
            if (untilRatelimit === 0) {
                untilRatelimit = 3;
                aliasString += "!wait 4 | ";
            }
        }

        if ((shirt || pants || tshirt || face) && (hats.size !== 0 && !(aliasString.endsWith("!wait 4 | ")))) aliasString += "!wait 4 | ";
        if (face) aliasString += `!face ${face.id} | `;
        if (shirt) aliasString += `!shirt ${shirt.id} | `;
        if (pants) aliasString += `!pants ${pants.id} | `;
        if (tshirt) aliasString += `!tshirt ${tshirt.id} | `;

        aliasString = aliasString.slice(0, -3);

        return interaction.reply({ embeds: [
            client.Functions.makeInfoEmbed({
                title: `${robloxUser.name}'s Character Alias`,
                description: `\`\`\`${aliasString}\`\`\``
            })
        ] });
    }
})

export default command;