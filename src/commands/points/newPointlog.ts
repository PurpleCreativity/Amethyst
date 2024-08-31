import { ButtonStyle, Emoji, type ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import type { PointLog } from "../../schemas/guildProfile.js";
import Modal from "../../classes/Modal.js";
import Emojis from "../../assets/Emojis.js";
import Icons from "../../assets/Icons.js";

export default new SlashCommand({
    name: "newlog",
    description: "Create a new point log",

    defer: true,
    module: "Points",
    customPermissions: ["CreatePointLogs"],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const creatorUser = await client.Functions.GetLinkedRobloxUser(interaction.user.id);
        if (!creatorUser) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Point Log Creator", description: "You must link your account to use this command" })] });

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);
        if (!guildDataProfile) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Guild unregistered", description: "This guild is not registered in the database", footer: { text: "Contact the bot developer to register your guild" } })] });

        const currentLog = {
            id: client.Functions.GenerateID(),

            creator: {
                username: creatorUser.name,
                id: creatorUser.id
            },

            data: [],
            notes: undefined as string | undefined,

            createdAt: new Date(),
        } as PointLog;

        const baseEmbed = client.Functions.makeInfoEmbed({ title: "Point Log Creator", description: "Use the buttons below to add or remove points from this log, or to add a note.", footer: { text: currentLog.id } });
        const buttonEmbed = new ButtonEmbed(baseEmbed);

        const updateEmbed = () => {
            const embed = baseEmbed;

            embed.setFields([]);

            embed.addFields({ name: "Note", value: `${currentLog.notes || "\`Unset\`"}` });

            for (const log of currentLog.data) {
                const foundField = embed.GetField(`> ${log.points} points`);

                if (foundField) {
                    foundField.value += `, \`${log.username}\``;
                    if (foundField.value.length > 1024) foundField.value = `${foundField.value.substring(0, 1021)}...`;
                    continue;
                }

                embed.addFields([{ name: `> ${log.points} points`, value: `\`${log.username}\`` }]);

                if (embed.data.fields?.length && embed.data.fields?.length >= 25) {
                    embed.setDescription(`## ${Emojis.warning} Unable to show full log!\nUse the buttons below to add or remove points from this log, or to add a note.`)
                    break;
                }

                embed.setDescription("Use the buttons below to add or remove points from this log, or to add a note.")
            }

            buttonEmbed.setEmbed(embed);
        }

        updateEmbed();

        const addData = buttonEmbed.addButton({
            label: "Add Data",
            style: ButtonStyle.Primary,
            emoji: Emojis.add,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                const modal = new Modal({
                    Title: "Add Data",
                    Inputs: [
                        new TextInputBuilder()
                            .setCustomId("data")
                            .setLabel("Data")
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder("1 - user1\n2 - user2,user3\n3 - user4, user5\nSetting a user to 0 points will remove them from the log")
                            .setRequired(true),
                    ]
                })

                const response = await modal.Prompt(buttonInteraction) as ModalSubmitInteraction;
                await response.deferUpdate();
                
                const data = response.fields.getTextInputValue("data");
                const lines = data.split("\n");

                buttonEmbed.disableButton(addData);
                buttonEmbed.disableButton(setNote);
                buttonEmbed.disableButton(fullData);
                buttonEmbed.disableButton(finishLog);
                buttonEmbed.disableButton(cancelLog);

                await interaction.editReply(buttonEmbed.getMessageData());
                await interaction.editReply({ embeds: [client.Functions.makeInfoEmbed({ title: "Point Log", description: `${Emojis.thinking} Processing data, please wait`})] })

                for (const line of lines) {
                    const [points, users] = line.split(" - ");
                    if (!points || !users) continue;

                    const actualPoints = Number.parseInt(points);
                    if (Number.isNaN(actualPoints)) continue;

                    const actualUsers = users.split(",");

                    for (let user of actualUsers) {
                        user = user.trim().toLowerCase();

                        const actualUser = await client.Functions.GetRobloxUser(user);
                        if (!actualUser) continue;

                        const foundEntry = currentLog.data.find((entry) => entry.username.toLowerCase() === actualUser.name.toLowerCase());
                        if (foundEntry) {
                            foundEntry.points = actualPoints;
                            if (foundEntry.points === 0) currentLog.data = currentLog.data.filter((entry) => entry.username.toLowerCase() !== actualUser.name.toLowerCase());
                            continue;
                        }

                        if (actualPoints === 0) continue;

                        currentLog.data.push({ username: actualUser.name, id: actualUser.id, points: actualPoints });
                    }
                }

                buttonEmbed.enableButton(addData);
                buttonEmbed.enableButton(setNote);
                buttonEmbed.enableButton(cancelLog);

                if (currentLog.data.length === 0) {
                    buttonEmbed.disableButton(fullData);
                    buttonEmbed.disableButton(finishLog);
                } else {
                    buttonEmbed.enableButton(fullData);
                    buttonEmbed.enableButton(finishLog);
                }

                updateEmbed();
                interaction.editReply(buttonEmbed.getMessageData());
            }
        })

        const setNote = buttonEmbed.addButton({
            label: "Set Note",
            style: ButtonStyle.Secondary,
            emoji: Emojis.description,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                const modal = new Modal({
                    Title: "Set Note",
                    Inputs: [
                        new TextInputBuilder()
                            .setCustomId("note")
                            .setLabel("Note")
                            .setStyle(TextInputStyle.Paragraph)
                            .setMaxLength(1024)
                            .setRequired(false)
                    ]
                })

                const response = await modal.Prompt(buttonInteraction) as ModalSubmitInteraction;
                await response.deferUpdate();
                currentLog.notes = response.fields.getTextInputValue("note");
                if (currentLog.notes === "") currentLog.notes = undefined;

                updateEmbed();
                interaction.editReply(buttonEmbed.getMessageData());
            }
        });

        buttonEmbed.nextRow();

        const fullData = buttonEmbed.addButton({
            label: "Full Data",
            style: ButtonStyle.Secondary,
            emoji: Emojis.folder_open,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                const pointsMap: { [key: number]: string[] } = {};
    
                for (const user of currentLog.data) {
                    if (!pointsMap[user.points]) {
                        pointsMap[user.points] = [];
                    }
                    pointsMap[user.points].push(user.username);
                }

                const userText = Object.entries(pointsMap)
                    .map(([points, usernames]) => `${points} - ${usernames.map(username => `${username}`).join(', ')}`)
                    .join('\n');

                const userBuffer = Buffer.from(userText, 'utf-8');

                await buttonInteraction.reply({ files: [{ name: `pointlog_${currentLog.id}_fulldata.txt`, attachment: userBuffer }], ephemeral: true });
            }
        });

        buttonEmbed.nextRow();

        const finishLog = buttonEmbed.addButton({
            label: "Finish Log",
            style: ButtonStyle.Success,
            emoji: Emojis.check,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                try {
                    await guildDataProfile.addPointLog(currentLog, creatorUser);
                    const baseEmbed = client.Functions.makePointlogEmbed(currentLog);
                    baseEmbed.setDescription(null);
                    baseEmbed.setColor(0x00ff00);
                    baseEmbed.setAuthor({ name: "Created", iconURL: Icons.check });

                    interaction.editReply({ embeds: [baseEmbed], components: [] });
                } catch (error) {
                    if (!(error instanceof Error)) return;
                    const baseEmbed = client.Functions.makeErrorEmbed({ title: "Point Log", description: `Failed to create point log:\n## ${error.name}\n\`\`\`${error.message}\`\`\`\n\nAttached below is the full data of the pointlog` });

                    const pointsMap: { [key: number]: string[] } = {};
    
                    for (const user of currentLog.data) {
                        if (!pointsMap[user.points]) {
                            pointsMap[user.points] = [];
                        }
                        pointsMap[user.points].push(user.username);
                    }

                    const userText = Object.entries(pointsMap)
                        .map(([points, usernames]) => `${points} - ${usernames.map(username => `${username}`).join(', ')}`)
                        .join('\n');

                    const userBuffer = Buffer.from(userText, 'utf-8');

                    await interaction.editReply({ embeds: [baseEmbed], components: [] });
                    await buttonInteraction.reply({ content: currentLog.notes ? `## Notes\n\`\`\`${currentLog.notes}\`\`\`` : undefined, files: [{ name: `pointlog_${currentLog.id}_fulldata.txt`, attachment: userBuffer }], ephemeral: true });
                }
            }
        });

        const cancelLog = buttonEmbed.addButton({
            label: "Cancel",
            style: ButtonStyle.Danger,
            emoji: Emojis.delete,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                interaction.editReply({ embeds: [client.Functions.makeInfoEmbed({ title: "Point Log", description: "Point log creation cancelled" })], components: [] });
            }
        });

        buttonEmbed.disableButton(fullData);
        buttonEmbed.disableButton(finishLog);

        interaction.editReply(buttonEmbed.getMessageData());
    }
})