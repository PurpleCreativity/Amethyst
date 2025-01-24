import {
    ButtonStyle,
    type GuildMember,
    MessageFlags,
    SlashCommandSubcommandBuilder,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };
import Images from "../../../public/Images.json" with { type: "json" };
import Button from "../../classes/components/Button.js";
import ButtonEmbed from "../../classes/components/ButtonEmbed.js";
import Modal from "../../classes/components/Modal.js";
import SlashCommand from "../../classes/components/SlashCommand.js";
import PointLog from "../../classes/database/PointLog.js";
import client from "../../main.js";
import { CommandModule, CommandPermission } from "../../types/core/Interactables.js";
import type Embed from "../../classes/components/Embed.js";

enum addDataMode {
    Increment = 0,
    Set = 1,
}

export default new SlashCommand({
    name: "pointlogs",
    description: "Pointlog commands",
    module: CommandModule.Points,

    ephemeral: true,

    permissions: [CommandPermission.PointlogCreator],

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
                        title: "Pointlog Creator",
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
                    }).onPressed(async (buttonInteraction) => {
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

                        addData.setDisabled(true);
                        setNote.setDisabled(true);
                        downloadData.setDisabled(true);
                        finishLog.setDisabled(true);
                        cancelLog.setDisabled(true);

                        await interaction.editReply(buttonEmbed.getMessageData());
                        await interaction.editReply({
                            embeds: [
                                client.Functions.makeInfoEmbed({
                                    title: "Pointlog Creator",
                                    description: `${Emojis.thinking} Processing data, please wait`,
                                }),
                            ],
                        });

                        const userPointsMap = new Map();
                        for (const line of lines) {
                            const [points, users] = line.split(" - ");
                            if (!points || !users) continue;

                            const actualPoints = Number.parseInt(points);
                            if (Number.isNaN(actualPoints)) continue;

                            const actualUsers = users
                                .split(",")
                                .map((user) =>
                                    Number.isNaN(Number.parseInt(user))
                                        ? user.trim().toLowerCase()
                                        : Number.parseInt(user),
                                );

                            for (const user of actualUsers) {
                                if (!userPointsMap.has(user)) {
                                    userPointsMap.set(user, 0);
                                }
                                userPointsMap.set(user, userPointsMap.get(user) + actualPoints);
                            }
                        }

                        const numericIds = [...userPointsMap.keys()].filter((key) => typeof key === "number");
                        const usernames = [...userPointsMap.keys()].filter((key) => typeof key === "string");
                        try {
                            const fetchedUsersByIds = await client.BloxWrap.fetchUsersByIds(numericIds, false);
                            const fetchedUsersByUsernames = await client.BloxWrap.fetchUsersByUsernames(
                                usernames,
                                false,
                            );

                            const userLookup = new Map<string | number, { id: number; username: string }>();
                            for (const user of [...fetchedUsersByIds, ...fetchedUsersByUsernames]) {
                                userLookup.set(user.id, { id: user.id, username: user.name });
                                userLookup.set(user.name.toLowerCase(), { id: user.id, username: user.name });
                            }

                            for (const [userKey, points] of userPointsMap.entries()) {
                                const actualUser = userLookup.get(userKey);
                                if (!actualUser) continue;

                                const foundEntry = pointlog.data.find((entry) => entry.user.robloxId === actualUser.id);
                                if (foundEntry) {
                                    if (currentMode === addDataMode.Increment) foundEntry.points += points;
                                    else foundEntry.points = points;

                                    if (foundEntry.points === 0) {
                                        pointlog.data = pointlog.data.filter(
                                            (entry) => entry.user.robloxId !== actualUser.id,
                                        );
                                    }
                                } else {
                                    if (points === 0) continue;

                                    pointlog.data.push({
                                        points: points,
                                        user: { robloxId: actualUser.id, robloxUsername: actualUser.username },
                                    });
                                }
                            }
                        } catch (error) {
                            const message = client.Functions.formatErrorMessage(error);

                            await interaction.followUp({
                                embeds: [
                                    client.Functions.makeErrorEmbed({
                                        title: "An error occured",
                                        description: `\`\`\`${message}\`\`\``,
                                    }),
                                ],
                            });
                        }

                        addData.setDisabled(false);
                        setNote.setDisabled(false);
                        cancelLog.setDisabled(false);

                        if (pointlog.data.length === 0) {
                            downloadData.setDisabled(true);
                            finishLog.setDisabled(true);
                        } else {
                            downloadData.setDisabled(false);
                            finishLog.setDisabled(false);
                        }

                        updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
                    }),
                );

                const setNote = buttonEmbed.addButton(
                    new Button({
                        label: "Set Note",
                        style: ButtonStyle.Secondary,
                        emoji: Emojis.description,
                        allowedUsers: [interaction.user.id],
                    }).onPressed(async (buttonInteraction) => {
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
                    }).onPressed(async (buttonInteraction) => {
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
                            flags: MessageFlags.Ephemeral,
                        });
                    }),
                );

                const toggleMode = buttonEmbed.addButton(
                    new Button({
                        label: "Mode: Increment",
                        style: ButtonStyle.Secondary,
                        emoji: Emojis.on,
                        allowedUsers: [interaction.user.id],
                    }).onPressed(async (buttonInteraction) => {
                        await buttonInteraction.deferUpdate();

                        if (currentMode === addDataMode.Increment) {
                            currentMode = addDataMode.Set;
                            toggleMode.setLabel("Mode: Set");
                            toggleMode.setEmoji(Emojis.off);
                        } else {
                            currentMode = addDataMode.Increment;
                            toggleMode.setLabel("Mode: Increment");
                            toggleMode.setEmoji(Emojis.on);
                        }

                        interaction.editReply(buttonEmbed.getMessageData());
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
                    }).onPressed(async (_buttonInteraction) => {
                        try {
                            await pointlog.save();

                            await interaction.editReply({
                                embeds: [
                                    client.Functions.makeSuccessEmbed({
                                        title: "Pointlog created",
                                        description: `Pointlog with id \`${pointlog.id}\` has been added to the database.`,
                                    }),
                                ],
                                components: [],
                            });
                            return;
                        } catch (error) {
                            const message = client.Functions.formatErrorMessage(error);

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

                            await interaction.editReply({
                                embeds: [
                                    client.Functions.makeErrorEmbed({
                                        title: "Pointlog creation failure",
                                        description: `There was an error registering the pointlog into the database:\n\n\`\`\`${message}\`\`\`\n\n**Attached below is the full data of the pointlog`,
                                    }),
                                ],
                                files: [{ name: `pointlog_${pointlog.id}_fulldata.txt`, attachment: userBuffer }],
                                components: [],
                            });
                            return;
                        }
                    }),
                );

                const cancelLog = buttonEmbed.addButton(
                    new Button({
                        label: "Cancel",
                        style: ButtonStyle.Danger,
                        emoji: Emojis.delete,
                        allowedUsers: [interaction.user.id],
                    }).oncePressed(async (_buttonInteraction) => {
                        interaction.editReply({
                            embeds: [
                                client.Functions.makeInfoEmbed({
                                    title: "Point Log",
                                    description: "Point log creation cancelled",
                                }),
                            ],
                            components: [],
                        });
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
                                title: "Your Pointlogs",
                                description: "You are not linked to a Roblox account.",
                            }),
                        ],
                    });
                }

                const guildUserProfile = await client.Database.getGuildUserProfile(
                    interaction.guild.id,
                    userProfile.roblox.id,
                );

                const pointlogs = await guildUserProfile.fetchCreatedPointlogs();
                if (pointlogs.length === 0) {
                    return await interaction.editReply({
                        embeds: [
                            client.Functions.makeInfoEmbed({
                                title: "Your Pointlogs",
                                description: "You don't have any pointlogs in the database.",
                            }),
                        ],
                    });
                }

                const embeds = [] as Embed[];
                for (const pointlog of pointlogs) {                    
                    embeds.push(client.Functions.makePointlogEmbed(pointlog));
                    if (embeds.length >= 100) break;
                }

                await interaction.editReply({
                    embeds: [
                        client.Functions.makeInfoEmbed({
                            title: "Your Pointlogs",
                            description: `You have \`${pointlogs.length}\` pending pointlog(s), only showing up to 100 logs!`,
                        }),
                    ],
                });

                for (let i = 0; i < embeds.length; i += 10) {
                    const batch = embeds.slice(i, i + 10);
                    try {
                        await interaction.followUp({ flags: MessageFlags.Ephemeral, embeds: batch })
                    } catch (error) {
                        await interaction.followUp({
                            flags: MessageFlags.Ephemeral,
                            embeds: [
                                client.Functions.makeErrorEmbed({
                                    title: "An error occured",
                                    description: "Some pointlogs failed to send.",
                                    footer: { text: "If this error persists, please contact the bot developer" },
                                }),
                            ],
                        });
                    }
                }
            }
        }
    },
});
