import { ButtonStyle, SlashCommandSubcommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };
import Button from "../../classes/components/Button.js";
import ButtonEmbed from "../../classes/components/ButtonEmbed.js";
import PointLog from "../../classes/database/PointLog.js";
import SlashCommand from "../../classes/interactables/SlashCommand.js";
import Modal from "../../classes/prompts/Modal.js";
import client from "../../main.js";

enum addDataMode {
    Increment = 0,
    Set = 1,
}

export default new SlashCommand({
    name: "pointlogs",
    description: "Pointlog commands",

    permissions: ["PointLogCreator"],

    subcommands: [
        new SlashCommandSubcommandBuilder().setName("new").setDescription("Create a new pointlog."),

        new SlashCommandSubcommandBuilder().setName("list").setDescription("Shows a list of your pending point logs."),

        new SlashCommandSubcommandBuilder()
            .setName("get")
            .setDescription("Returns a pointlog (if found) with the provided query options.")
            .addStringOption((option) =>
                option
                    .setName("id")
                    .setRequired(false)
                    .setDescription(
                        "The pointlog id you're looking for, if specified all other query options are ignored.",
                    ),
            )
            .addStringOption((option) =>
                option
                    .setName("creator")
                    .setRequired(false)
                    .setDescription("The roblox creator's username or id to filter logs by."),
            )
            .addStringOption((option) =>
                option
                    .setName("included-user")
                    .setRequired(false)
                    .setDescription("The included user's username or id to filter logs by."),
            ),
    ],

    function: async (interaction, guildProfile) => {
        if (!guildProfile || !interaction.guild) throw new Error("Unknown error");

        const userProfile = await client.Database.getUserProfile(interaction.user.id);
        if (!userProfile.roblox.id || !userProfile.roblox.username) {
            return await interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "Pointlogs",
                        description: "You are not linked to a Roblox account",
                    }),
                ],
            });
        }

        const subcommand = interaction.options.getSubcommand(true);
        switch (subcommand) {
            case "new": {
                const pointlog = new PointLog({
                    id: client.Functions.GenerateUUID(),
                    __v: 0,
                    guildId: interaction.guild.id,

                    data: [],
                    note: null,

                    creatorRobloxId: userProfile.roblox.id,
                    creatorRobloxUsername: userProfile.roblox.username,

                    createdAt: new Date(),
                });
                let currentMode = addDataMode.Increment;

                const buttonEmbed = new ButtonEmbed(
                    client.Functions.makeInfoEmbed({
                        title: "Point Log Creator",
                        description: "Use the buttons below to add or remove points from this log, or to add a note.",
                        footer: { text: pointlog.id },
                    }),
                );

                const updateEmbed = () => {
                    buttonEmbed.embed.setFields([]);

                    buttonEmbed.embed.addFields({ name: "Note", value: `${pointlog.note || "`Unset`"}` });
                    for (const entry of pointlog.data) {
                        const foundField = buttonEmbed.embed.getField(`> ${entry.points} points`);

                        if (foundField) {
                            foundField.value += `, \`${entry.user.robloxUsername}\``;
                            if (foundField.value.length > 1024)
                                foundField.value = `${foundField.value.substring(0, 1021)}...`;
                            continue;
                        }

                        buttonEmbed.embed.addFields([
                            { name: `> ${entry.points} points`, value: `\`${entry.user.robloxUsername}\`` },
                        ]);

                        if (buttonEmbed.embed.data.fields?.length && buttonEmbed.embed.data.fields?.length >= 25) {
                            buttonEmbed.embed.setDescription(
                                `## ${Emojis.warning} Unable to show full log!\nUse the buttons below to add or remove points from this log, or to add a note.`,
                            );
                            break;
                        }

                        buttonEmbed.embed.setDescription(
                            "Use the buttons below to add or remove points from this log, or to add a note.",
                        );
                    }
                };

                updateEmbed();

                const addData = buttonEmbed.addButton(
                    new Button({
                        label: "Add Data",
                        style: ButtonStyle.Primary,
                        emoji: Emojis.add,
                        allowedUsers: [interaction.user.id],

                        function: async (buttonInteraction) => {
                            const modal = new Modal({
                                title: "Add Data",
                                inputs: [
                                    new TextInputBuilder()
                                        .setCustomId("data")
                                        .setLabel("Data")
                                        .setStyle(TextInputStyle.Paragraph)
                                        .setPlaceholder(
                                            "1 - user1\n2 - user2,user3\n3 - user4, user5\nSetting a user to 0 points will remove them from the log",
                                        )
                                        .setRequired(true),
                                ],
                            });

                            const response = await modal.prompt(buttonInteraction);
                            await response.deferUpdate();

                            const data = response.fields.getTextInputValue("data");
                            const lines = data.split("\n");

                            buttonEmbed.disableButton(addData);
                            buttonEmbed.disableButton(setNote);
                            buttonEmbed.disableButton(downloadData);
                            buttonEmbed.disableButton(finishLog);
                            buttonEmbed.disableButton(cancelLog);

                            await interaction.editReply(buttonEmbed.getMessageData());
                            await interaction.editReply({
                                embeds: [
                                    client.Functions.makeInfoEmbed({
                                        title: "Point Log",
                                        description: `${Emojis.thinking} Processing data, please wait`,
                                    }),
                                ],
                            });

                            for (const line of lines) {
                                const [points, users] = line.split(" - ");
                                if (!points || !users) continue;

                                const actualPoints = Number.parseInt(points);
                                if (Number.isNaN(actualPoints)) continue;

                                const actualUsers = users.split(",");

                                for (let user of actualUsers) {
                                    user = user.trim().toLowerCase();

                                    const actualUser = await client.Functions.fetchRobloxUser(user);
                                    if (!actualUser) continue;

                                    const foundEntry = pointlog.data.find(
                                        (entry) =>
                                            entry.user.robloxUsername.toLowerCase() === actualUser.name.toLowerCase(),
                                    );
                                    if (foundEntry) {
                                        if (currentMode === addDataMode.Increment) foundEntry.points += actualPoints;
                                        else foundEntry.points = actualPoints;

                                        if (foundEntry.points === 0)
                                            pointlog.data = pointlog.data.filter(
                                                (entry) =>
                                                    entry.user.robloxUsername.toLowerCase() !==
                                                    actualUser.name.toLowerCase(),
                                            );
                                        continue;
                                    }

                                    if (actualPoints === 0) continue;

                                    pointlog.data.push({
                                        points: actualPoints,
                                        user: { robloxId: actualUser.id, robloxUsername: actualUser.name },
                                    });
                                }
                            }

                            buttonEmbed.enableButton(addData);
                            buttonEmbed.enableButton(setNote);
                            buttonEmbed.enableButton(cancelLog);

                            if (pointlog.data.length === 0) {
                                buttonEmbed.disableButton(downloadData);
                                buttonEmbed.disableButton(finishLog);
                            } else {
                                buttonEmbed.enableButton(downloadData);
                                buttonEmbed.enableButton(finishLog);
                            }

                            updateEmbed();
                            interaction.editReply(buttonEmbed.getMessageData());
                        },
                    }),
                );

                const setNote = buttonEmbed.addButton(
                    new Button({
                        label: "Set Note",
                        style: ButtonStyle.Secondary,
                        emoji: Emojis.description,
                        allowedUsers: [interaction.user.id],

                        function: async (buttonInteraction) => {
                            const modal = new Modal({
                                title: "Set Note",
                                inputs: [
                                    new TextInputBuilder()
                                        .setCustomId("note")
                                        .setLabel("Note")
                                        .setStyle(TextInputStyle.Paragraph)
                                        .setMaxLength(1024)
                                        .setRequired(false),
                                ],
                            });

                            const response = await modal.prompt(buttonInteraction);
                            await response.deferUpdate();

                            pointlog.note = response.fields.getTextInputValue("note");
                            if (pointlog.note.length === 0) pointlog.note = null;

                            updateEmbed();
                            interaction.editReply(buttonEmbed.getMessageData());
                        },
                    }),
                );

                buttonEmbed.nextRow();

                const downloadData = buttonEmbed.addButton(
                    new Button({
                        label: "Download",
                        style: ButtonStyle.Secondary,
                        emoji: Emojis.import,
                        allowedUsers: [interaction.user.id],
                        disabled: true,

                        function: async (buttonInteraction) => {
                            const pointsMap: { [key: number]: string[] } = {};

                            for (const user of pointlog.data) {
                                if (!pointsMap[user.points]) {
                                    pointsMap[user.points] = [];
                                }
                                pointsMap[user.points].push(user.user.robloxUsername);
                            }

                            const userText = Object.entries(pointsMap)
                                .map(
                                    ([points, usernames]) =>
                                        `${points} - ${usernames.map((username) => `${username}`).join(", ")}`,
                                )
                                .join("\n");

                            const userBuffer = Buffer.from(userText, "utf-8");

                            await buttonInteraction.reply({
                                files: [{ name: `pointlog_${pointlog.id}_fulldata.txt`, attachment: userBuffer }],
                                ephemeral: true,
                            });
                        },
                    }),
                );

                const toggleMode = buttonEmbed.addButton(
                    new Button({
                        label: "Mode: Increment",
                        style: ButtonStyle.Secondary,

                        allowedUsers: [interaction.user.id],

                        function: async (buttonInteraction) => {
                            await buttonInteraction.deferUpdate();

                            if (currentMode === addDataMode.Increment) {
                                currentMode = addDataMode.Set;
                                toggleMode.setLabel("Mode: Set");
                            } else {
                                currentMode = addDataMode.Increment;
                                toggleMode.setLabel("Mode: Increment");
                            }

                            interaction.editReply(buttonEmbed.getMessageData());
                        },
                    }),
                );

                buttonEmbed.nextRow();

                const finishLog = buttonEmbed.addButton(
                    new Button({
                        label: "Finish Log",
                        style: ButtonStyle.Success,
                        emoji: Emojis.check,
                        allowedUsers: [interaction.user.id],
                        disabled: true,

                        function: async (_buttonInteraction) => {
                            try {
                                await pointlog.save();

                                return await interaction.editReply({
                                    embeds: [
                                        client.Functions.makeSuccessEmbed({
                                            title: "Pointlog created",
                                            description: `Pointlog with id \`${pointlog.id}\` has been added to the database.`,
                                        }),
                                    ],
                                    components: [],
                                });
                            } catch (error) {
                                const message: string =
                                    error && typeof error === "object" && "message" in error
                                        ? (error as { message: string }).message
                                        : "Unknown error";
                                if (error && typeof error === "object" && "stack" in error) client.error(error.stack);

                                const pointsMap: { [key: number]: string[] } = {};

                                for (const user of pointlog.data) {
                                    if (!pointsMap[user.points]) {
                                        pointsMap[user.points] = [];
                                    }
                                    pointsMap[user.points].push(user.user.robloxUsername);
                                }

                                const userText = Object.entries(pointsMap)
                                    .map(
                                        ([points, usernames]) =>
                                            `${points} - ${usernames.map((username) => `${username}`).join(", ")}`,
                                    )
                                    .join("\n");

                                const userBuffer = Buffer.from(userText, "utf-8");

                                return await interaction.editReply({
                                    embeds: [
                                        client.Functions.makeErrorEmbed({
                                            title: "Pointlog creation failure",
                                            description: `There was an error registering the pointlog into the database:\n\n\`\`\`${message}\`\`\`\n\n**Attached below is the full data of the pointlog`,
                                        }),
                                    ],
                                    files: [{ name: `pointlog_${pointlog.id}_fulldata.txt`, attachment: userBuffer }],
                                    components: [],
                                });
                            }
                        },
                    }),
                );

                const cancelLog = buttonEmbed.addButton(
                    new Button({
                        label: "Cancel",
                        style: ButtonStyle.Danger,
                        emoji: Emojis.delete,
                        allowedUsers: [interaction.user.id],

                        function: async (_buttonInteraction) => {
                            interaction.editReply({
                                embeds: [
                                    client.Functions.makeInfoEmbed({
                                        title: "Point Log",
                                        description: "Point log creation cancelled",
                                    }),
                                ],
                                components: [],
                            });
                        },
                    }),
                );

                interaction.editReply(buttonEmbed.getMessageData());
                break;
            }

            case "list": {
                const userProfile = await client.Database.getUserProfile(interaction.user.id);
                if (!userProfile.roblox.id) {
                    return await interaction.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "Your Points",
                                description: "You are not linked to a Roblox account",
                            }),
                        ],
                    });
                }

                const guildUserProfile = await client.Database.getGuildUserProfile(
                    interaction.guild.id,
                    userProfile.roblox.id,
                );
            }
        }
    },
});
