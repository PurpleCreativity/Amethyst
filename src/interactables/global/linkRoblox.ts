import { ButtonStyle, SlashCommandStringOption } from "discord.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };
import Button from "../../classes/components/Button.js";
import ButtonEmbed from "../../classes/components/ButtonEmbed.js";
import SlashCommand from "../../classes/components/SlashCommand.js";
import client from "../../main.js";
import { CommandModule } from "../../types/core/Interactables.js";

const permittedWords = [
    "apple",
    "banana",
    "cherry",
    "grape",
    "kiwi",
    "lemon",
    "mango",
    "orange",
    "papaya",
    "raspberry",
    "strawberry",
    "grapefruit",
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
    description: "Link your Roblox account to your Discord account.",
    module: CommandModule.Global,

    userApp: true,
    ephemeral: true,

    options: [
        new SlashCommandStringOption().setName("user").setDescription("Your Roblox Username or Id.").setRequired(true),
    ],

    function: async (interaction) => {
        const user = interaction.options.getString("user", true);
        const robloxUser = await client.Functions.fetchRobloxUser(user);

        if (!robloxUser) {
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

        const userProfile = await client.Database.getUserProfile(interaction.user.id);
        let code = generateCode();

        const buttonEmbed = new ButtonEmbed(
            client.Functions.makeInfoEmbed({
                title: "Link Roblox",
                description: `Hi, ${interaction.user.username}! To make sure you're the owner of the account, please set your [roblox profile](https://www.roblox.com/users/${robloxUser.id}/profile) description to the following:\n\n\`\`\`${code}\`\`\`\n\nOnce you have done this, click the button below to link your account.`,
            }),
        );

        buttonEmbed.addButton(
            new Button({
                label: "Link",
                style: ButtonStyle.Success,
                emoji: Emojis.check,
                allowedUsers: [interaction.user.id],
            }).onPressed(async (buttonInteraction) => {
                await buttonInteraction.deferReply();

                try {
                    const updatedDescription = (await client.Functions.fetchRobloxUser(robloxUser.id, false))
                        .description;
                    if (!updatedDescription.includes(code.trim())) {
                        await interaction.editReply({
                            embeds: [
                                client.Functions.makeErrorEmbed({
                                    title: "Profile description mismatch",
                                    description: "The given code was not found in your profile description.",
                                }),
                            ],

                            components: [],
                        });
                        return await buttonInteraction.deleteReply();
                    }

                    userProfile.roblox.id = robloxUser.id;
                    userProfile.roblox.username = robloxUser.name;
                    await userProfile.save();

                    await interaction.editReply({
                        embeds: [
                            client.Functions.makeSuccessEmbed({
                                title: "Link successful",
                                description: `Your account has been linked to \`${robloxUser.name}:${robloxUser.id}\``,
                            }),
                        ],

                        components: [],
                    });
                    return await buttonInteraction.deleteReply();
                } catch (error) {
                    const message: string =
                        error && typeof error === "object" && "message" in error
                            ? (error as { message: string }).message
                            : "Unknown error";

                    client.error(error);

                    await interaction.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occurred",
                                description: `\`\`\`${message}\`\`\``,
                            }),
                        ],

                        components: [],
                    });
                    return await buttonInteraction.deleteReply();
                }
            }),
        );

        buttonEmbed.addButton(
            new Button({
                label: "Cancel",
                style: ButtonStyle.Danger,
                emoji: Emojis.delete,
                allowedUsers: [interaction.user.id],
            }).oncePressed(async (buttonInteraction) => {
                await buttonInteraction.deferUpdate();

                buttonEmbed.setButtons([]);
                buttonEmbed.embed = client.Functions.makeInfoEmbed({
                    title: "Link Roblox",
                    description: "Linking cancelled.",
                });

                await buttonInteraction.editReply(buttonEmbed.getMessageData());
            }),
        );

        buttonEmbed.nextRow();

        buttonEmbed.addButton(
            new Button({
                label: "The code was filtered",
                style: ButtonStyle.Secondary,
                emoji: Emojis.warning,
                allowedUsers: [interaction.user.id],
            }).onPressed(async (buttonInteraction) => {
                await buttonInteraction.deferUpdate();

                code = generateCode();
                buttonEmbed.embed.setDescription(
                    `Hi, ${interaction.user.username}! To make sure you're the owner of the account, please set your [roblox profile](https://www.roblox.com/users/${robloxUser.id}/profile) description to the following:\n\n\`\`\`${code}\`\`\`\n\nOnce you have done this, click the button below to link your account.`,
                );

                await buttonInteraction.editReply(buttonEmbed.getMessageData());
            }),
        );

        if (userProfile.roblox.id) {
            const buttonEmbed2 = new ButtonEmbed(
                client.Functions.makeWarnEmbed({
                    title: "Already linked",
                    description: `You already have a [linked roblox account](https://www.roblox.com/users/${userProfile.id}/profile)`,
                }),
            );

            buttonEmbed2.addButton(
                new Button({
                    label: "Continue",
                    style: ButtonStyle.Success,
                    emoji: Emojis.check,
                    allowedUsers: [interaction.user.id],
                }).oncePressed(async (buttonInteraction) => {
                    await buttonInteraction.deferUpdate();
                    await interaction.editReply(buttonEmbed.getMessageData());
                }),
            );

            buttonEmbed2.addButton(
                new Button({
                    label: "Cancel",
                    style: ButtonStyle.Danger,
                    emoji: Emojis.delete,
                    allowedUsers: [interaction.user.id],
                }).oncePressed(async (buttonInteraction) => {
                    await buttonInteraction.deferUpdate();
                    await interaction.editReply({
                        embeds: [
                            client.Functions.makeInfoEmbed({
                                title: "Operation cancelled",
                                description: "Cancelled roblox account link",
                                footer: { text: "You can now dismiss this message" },
                            }),
                        ],
                        components: [],
                    });
                }),
            );

            await interaction.editReply(buttonEmbed2.getMessageData());
        } else {
            await interaction.editReply(buttonEmbed.getMessageData());
        }
    },
});
