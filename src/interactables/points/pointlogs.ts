import {
    ButtonStyle,
    type GuildMember,
    SlashCommandSubcommandBuilder,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };
import Images from "../../../public/Images.json" with { type: "json" };
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

                                const userLookup = new Map(
                                    [...fetchedUsersByIds, ...fetchedUsersByUsernames].map((user) => [
                                        user.name,
                                        { id: user.id, username: user.name },
                                    ]),
                                );

                                for (const [userKey, points] of userPointsMap.entries()) {
                                    const actualUser = userLookup.get(userKey);
                                    if (!actualUser) continue;

                                    const foundEntry = pointlog.data.find(
                                        (entry) => entry.user.robloxId === actualUser.id,
                                    );
                                    if (foundEntry) {
                                        if (currentMode === addDataMode.Increment) foundEntry.points += points;
                                        else foundEntry.points = points;

                                        if (foundEntry.points === 0) {
                                            pointlog.data = pointlog.data.filter(
                                                (entry) => entry.user.robloxId !== actualUser.id,
                                            );
                                            continue;
                                        }
                                    }

                                    if (points === 0) continue;

                                    pointlog.data.push({
                                        points: points,
                                        user: { robloxId: actualUser.id, robloxUsername: actualUser.username },
                                    });
                                }
                            } catch (error) {
                                const message: string =
                                    error && typeof error === "object" && "message" in error
                                        ? (error as { message: string }).message
                                        : "Unknown error";
                                if (error && typeof error === "object" && "stack" in error) client.error(error.stack);

                                await interaction.followUp({
                                    embeds: [
                                        client.Functions.makeErrorEmbed({
                                            title: "An error occured",
                                            description: `\`\`\`${message}\`\`\``,
                                        }),
                                    ],
                                });
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
                        emoji: Emojis.on,
                        allowedUsers: [interaction.user.id],

                        function: async (buttonInteraction) => {
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

                const embeds = [] as ButtonEmbed[];
                for (const pointlog of pointlogs) {
                    const pointlogEmbed = client.Functions.makePointlogEmbed(pointlog);
                    const buttonEmbed = new ButtonEmbed(pointlogEmbed);

                    buttonEmbed.addButton(
                        new Button({
                            label: "Download",
                            style: ButtonStyle.Secondary,
                            emoji: Emojis.import,
                            allowedUsers: [interaction.user.id],

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

                    buttonEmbed.nextRow();

                    buttonEmbed.addButton(
                        new Button({
                            label: "Import",
                            style: ButtonStyle.Success,
                            emoji: Emojis.import,
                            allowedUsers: [interaction.user.id],
                            disabled: guildProfile.checkPermissions(interaction.member as GuildMember, [
                                "PointsManager",
                            ]),
                        }),
                    );

                    buttonEmbed.addButton(
                        new Button({
                            label: "Delete",
                            style: ButtonStyle.Danger,
                            emoji: Emojis.delete,
                            allowedUsers: [interaction.user.id],

                            function: async (buttonInteraction) => {
                                try {
                                    await pointlog.delete();

                                    const embed = client.Functions.makePointlogEmbed(pointlog);
                                    embed.setColor(0xff0000);
                                    embed.setAuthor({ name: "Deleted", iconURL: Images.close });
                                    embed.setTimestamp();

                                    await buttonInteraction.deferUpdate();
                                    await buttonInteraction.message.edit({ embeds: [embed], components: [] });
                                } catch (error) {
                                    const message: string =
                                        error && typeof error === "object" && "message" in error
                                            ? (error as { message: string }).message
                                            : "Unknown error";
                                    if (error && typeof error === "object" && "stack" in error)
                                        client.error(error.stack);

                                    await buttonInteraction.message.edit({
                                        embeds: [
                                            client.Functions.makeErrorEmbed({
                                                title: "Failed to delete pointlog",
                                                description: `\`\`\`${message}\`\`\``,
                                            }),
                                        ],
                                    });
                                }
                            },
                        }),
                    );

                    embeds.push(buttonEmbed);
                }

                await interaction.editReply({
                    embeds: [
                        client.Functions.makeInfoEmbed({
                            title: "Your Pointlogs",
                            description: `You have \`${pointlogs.length}\` pending pointlogs.`,
                        }),
                    ],
                });

                if (!(interaction.channel instanceof TextChannel)) return;
                for (const embed of embeds) {
                    try {
                        await interaction.channel.send(embed.getMessageData());
                    } catch (error) {
                        if (!(error instanceof Error)) return;
                        await interaction.followUp({
                            embeds: [
                                client.Functions.makeErrorEmbed({
                                    title: error.name,
                                    description: `Failed to send point log \`${embed.embed.data.title}\`\n\n\`\`\`${error.message}\`\`\``,
                                    footer: { text: "If this error persists, please contact the bot developer" },
                                }),
                            ],
                            ephemeral: true,
                        });
                    }
                }
            }
        }
    },
});
