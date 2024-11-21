import { ButtonStyle, SlashCommandStringOption } from "discord.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../main.js";

const permittedWords = [
    "apple",
    "banana",
    "cherry",
    "date",
    "elderberry",
    "fig",
    "grape",
    "honeydew",
    "kiwi",
    "lemon",
    "mango",
    "nectarine",
    "orange",
    "papaya",
    "quince",
    "raspberry",
    "strawberry",
    "tangerine",
    "ugli",
    "vanilla",
    "watermelon",
    "xigua",
    "yellowfruit",
    "grapefruit",
    "huckleberry",
    "imbe",
    "jackfruit",
    "kumquat",
    "lime",
    "mulberry",
    "navel",
    "olive",
    "peach",
    "plum",
    "quandong",
    "rambutan",
    "soursop",
    "tamarind",
    "ugni",
    "voavanga",
    "wolfberry",
    "ximenia",
    "yumberry",
];

const generateCode = () => {
    let code = "";
    for (let i = 0; i < 5; i++) {
        const word = permittedWords[Math.floor(Math.random() * permittedWords.length)];
        code += `${word} `;
    }

    return `a ${code}`.trimEnd();
};

export default new SlashCommand({
    name: "linkroblox",
    description: "Link your Roblox account to your Discord account",

    options: [
        new SlashCommandStringOption().setName("user").setDescription("Your Roblox username or Id").setRequired(true),
    ],

    function: async (interaction, _guildProfile) => {
        const userInput = interaction.options.getString("user", true);
        const robloxUser = await client.Functions.fetchRobloxUser(userInput);

        if (!robloxUser) {
            return await interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "Link Roblox",
                        description: "User not found.",
                    }),
                ],
            });
        }

        let code = generateCode();

        const buttonEmbed = new ButtonEmbed(
            client.Functions.makeInfoEmbed({
                title: "Link Roblox",
                description: `Hi, \`@${interaction.user.username}\`! To make sure you're the owner of the account, please set your roblox description to the following:\n\n\`\`\`${code}\`\`\`\n\nOnce you have done this, click the button below to link your account.`,
            }),
        );

        buttonEmbed.addButton({
            label: "Link",
            style: ButtonStyle.Success,
            emoji: Emojis.check,

            function: async (buttonInteraction) => {},
        });

        buttonEmbed.addButton({
            label: "Cancel",
            style: ButtonStyle.Danger,
            emoji: Emojis.delete,

            function: async (buttonInteraction) => {
                await buttonInteraction.deferUpdate();

                buttonEmbed.setButtons([]);
                buttonEmbed.setEmbed(
                    client.Functions.makeInfoEmbed({ title: "Link Roblox", description: "Linking cancelled." }),
                );

                await buttonInteraction.editReply(buttonEmbed.getMessageData());
            },
        });

        buttonEmbed.nextRow();

        buttonEmbed.addButton({
            label: "The code was filtered",
            style: ButtonStyle.Secondary,
            emoji: Emojis.warning,

            function: async (buttonInteraction) => {
                await buttonInteraction.deferUpdate();

                code = generateCode();

                buttonEmbed.Embed.setDescription(
                    `Hi, \`@${interaction.user.username}\`! To make sure you're the owner of the account, please set your roblox description to the following:\n\n\`\`\`${code}\`\`\`\n\nOnce you have done this, click the button below to link your account.`,
                );

                await buttonInteraction.editReply(buttonEmbed.getMessageData());
            },
        });

        return await interaction.editReply(buttonEmbed.getMessageData());
    },
});
