import { ButtonStyle, SlashCommandStringOption } from "discord.js";
import Emojis from "../../public/Emojis.json" with { type: "json" };
import ButtonEmbed from "../classes/ButtonEmbed.js";
import SlashCommand from "../classes/SlashCommand.js";
import client from "../main.js";

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
const generateDescription = () => {
    let description = "";
    for (let i = 0; i < 5; i++) {
        const word = permittedWords[Math.floor(Math.random() * permittedWords.length)];
        description += `${word} `;
    }

    return `a ${description}`.trimEnd();
};

export default new SlashCommand({
    name: "linkroblox",
    description: "Link your Discord account to your Roblox account.",

    user_installable: true,

    options: [
        new SlashCommandStringOption().setName("username").setDescription("Your Roblox username.").setRequired(true),
    ],

    function: async (interaction) => {
        const username = interaction.options.getString("username", true);
        const account = await client.Functions.fetchRobloxUser(username, false);
        if (!account) {
            await interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "Link Roblox",
                        description: "User not found.",
                    }),
                ],
            });
            return;
        }

        let code = generateDescription();

        const buttonEmbed = new ButtonEmbed(
            client.Functions.makeInfoEmbed({
                title: "Link Roblox",
                description: `Hi, ${interaction.user.username}! To make sure you're the owner of the Roblox account, please set your profile description to the following:\n\n\`\`\`${code}\`\`\`\n\nOnce you've done that, click the button below to verify.`,
            }),
        );

        buttonEmbed.addButton({
            label: "Link",
            style: ButtonStyle.Success,
            emoji: Emojis.check,

            function: async (buttonInteraction) => {
                await buttonInteraction.deferUpdate();

                const user = await client.Functions.fetchRobloxUser(username, false);
                if (!user) {
                    buttonEmbed.setEmbed(
                        client.Functions.makeErrorEmbed({
                            title: "Link Roblox",
                            description: "User not found.",
                        }),
                    );

                    buttonEmbed.setButtons([]);
                    await interaction.editReply(buttonEmbed.getMessageData());

                    return;
                }

                if (!user.description.trim().includes(code)) {
                    buttonEmbed.setEmbed(
                        client.Functions.makeErrorEmbed({
                            title: "Link Roblox",
                            description: "Your profile description does not match the code.",
                        }),
                    );

                    buttonEmbed.setButtons([]);
                    await interaction.editReply(buttonEmbed.getMessageData());

                    return;
                }

                const userProffile = await client.Database.fetchUserProfile(interaction.user.id);
                await userProffile.linkRoblox({ id: user.id, name: user.name });

                buttonEmbed.setEmbed(
                    client.Functions.makeSuccessEmbed({
                        title: "Link Roblox",
                        thumbnail: await user.fetchAvatarHeadshotUrl(),
                        description: `Account linked to \`${user.name}\``,
                    }),
                );

                buttonEmbed.setButtons([]);
                await interaction.editReply(buttonEmbed.getMessageData());
            },
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

                console.log(buttonEmbed.Rows);
                console.log(buttonEmbed.getMessageData());

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

                code = generateDescription();

                buttonEmbed.Embed.setDescription(
                    `Hi, ${interaction.user.username}! To make sure you're the owner of the Roblox account, please set your profile description to the following:\n\n\`\`\`${code}\`\`\`\n\nOnce you've done that, click the button below to verify.`,
                );

                await buttonInteraction.editReply(buttonEmbed.getMessageData());
            },
        });

        await interaction.editReply(buttonEmbed.getMessageData());
    },
});
