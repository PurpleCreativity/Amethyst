import { ButtonStyle, MessageFlags, TextInputBuilder, TextInputStyle } from "discord.js";
import Button from "../../classes/components/Button.js";
import ButtonEmbed from "../../classes/components/ButtonEmbed.js";
import Modal from "../../classes/components/Modal.js";
import SlashCommand from "../../classes/components/SlashCommand.js";
import client from "../../main.js";
import { CommandModule } from "../../types/core/Interactables.js";

export default new SlashCommand({
    name: "epochbuilder",
    description: "Builds an epoch",
    module: CommandModule.Global,

    ephemeral: true,
    userApp: true,

    function: async (interaction) => {
        let epoch = Math.round(Date.now() / 1000);

        const baseEmbed = client.Functions.makeInfoEmbed({
            title: "Epoch Builder",
            fields: [
                {
                    name: "Epoch",
                    value: `\`\`\`${epoch.toString()}\`\`\``,
                    inline: true,
                },
                {
                    name: "Epoch Date",
                    value: `<t:${epoch}:F>\n<t:${epoch}:R>`,
                    inline: true,
                },
            ],
        });

        const buttonEmbed = new ButtonEmbed(baseEmbed);

        const updateEmbed = () => {
            buttonEmbed.embed.setFields([
                {
                    name: "Epoch",
                    value: `\`\`\`${epoch.toString()}\`\`\``,
                    inline: true,
                },
                {
                    name: "Epoch Date",
                    value: `<t:${epoch}:F>\n<t:${epoch}:R>`,
                    inline: true,
                },
            ]);
        };

        buttonEmbed.addButton(
            new Button({
                label: "Add Minutes",
                style: ButtonStyle.Success,
                allowedUsers: [interaction.user.id],
            }).onPressed(async (buttonInteraction) => {
                const modal = new Modal({
                    title: "Add Minutes",
                    inputs: [
                        new TextInputBuilder()
                            .setCustomId("minutes")
                            .setLabel("Minutes")
                            .setRequired(true)
                            .setStyle(TextInputStyle.Short),
                    ],
                });

                const response = await modal.prompt(buttonInteraction);
                const minutes = Number.parseInt(response.fields.getTextInputValue("minutes"));

                await response.deferUpdate();

                epoch += minutes * 60;
                updateEmbed();
                await interaction.editReply(buttonEmbed.getMessageData());
            }),
        );

        buttonEmbed.addButton(
            new Button({
                label: "Add Hours",
                style: ButtonStyle.Success,
                allowedUsers: [interaction.user.id],
            }).onPressed(async (buttonInteraction) => {
                const modal = new Modal({
                    title: "Add Hours",
                    inputs: [
                        new TextInputBuilder()
                            .setCustomId("hours")
                            .setLabel("Hours")
                            .setRequired(true)
                            .setStyle(TextInputStyle.Short),
                    ],
                });

                const response = await modal.prompt(buttonInteraction);
                const hours = Number.parseInt(response.fields.getTextInputValue("hours"));

                await response.deferUpdate();

                epoch += hours * 60 * 60;
                updateEmbed();
                await interaction.editReply(buttonEmbed.getMessageData());
            }),
        );

        buttonEmbed.addButton(
            new Button({
                label: "Add Days",
                style: ButtonStyle.Success,
                allowedUsers: [interaction.user.id],
            }).onPressed(async (buttonInteraction) => {
                const modal = new Modal({
                    title: "Add Days",
                    inputs: [
                        new TextInputBuilder()
                            .setCustomId("days")
                            .setLabel("Days")
                            .setRequired(true)
                            .setStyle(TextInputStyle.Short),
                    ],
                });

                const response = await modal.prompt(buttonInteraction);
                const days = Number.parseInt(response.fields.getTextInputValue("days"));

                await response.deferUpdate();

                epoch += days * 60 * 60 * 24;
                updateEmbed();
                await interaction.editReply(buttonEmbed.getMessageData());
            }),
        );

        buttonEmbed.nextRow();

        buttonEmbed.addButton(
            new Button({
                label: "Round up hour",
                style: ButtonStyle.Secondary,
                allowedUsers: [interaction.user.id],
            }).onPressed(async (buttonInteraction) => {
                await buttonInteraction.deferUpdate();

                const currentMinute = new Date(epoch * 1000).getMinutes();
                if (currentMinute >= 30) {
                    epoch = Math.ceil(epoch / 3600) * 3600;
                } else {
                    epoch = Math.floor(epoch / 3600) * 3600;
                }

                updateEmbed();
                await interaction.editReply(buttonEmbed.getMessageData());
            }),
        );

        buttonEmbed.addButton(
            new Button({
                label: "Set Timestamp",
                style: ButtonStyle.Primary,
                allowedUsers: [interaction.user.id],
            }).onPressed(async (buttonInteraction) => {
                const modal = new Modal({
                    title: "Set Epoch",
                    inputs: [
                        new TextInputBuilder()
                            .setCustomId("epoch")
                            .setLabel("Epoch")
                            .setRequired(true)
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder("Unix Timestamp")
                            .setValue(epoch.toString()),
                    ],
                });

                const response = await modal.prompt(buttonInteraction);
                const newEpoch = Number.parseInt(response.fields.getTextInputValue("epoch"));

                await response.deferUpdate();

                epoch = newEpoch;
                updateEmbed();
                await interaction.editReply(buttonEmbed.getMessageData());
            }),
        );

        buttonEmbed.nextRow();

        buttonEmbed.addButton(
            new Button({
                label: "Format/Export",
                style: ButtonStyle.Primary,
                allowedUsers: [interaction.user.id],
            }).onPressed(async (buttonInteraction) => {
                await buttonInteraction.reply({
                    content: epoch.toString(),
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        client.Functions.makeInfoEmbed({
                            title: "Epoch Export",
                            fields: [
                                { name: "Raw", value: `\`${epoch.toString()}\``, inline: true },
                                {
                                    name: "Default",
                                    value: `\`<t:${epoch.toString()}>\`\n<t:${epoch.toString()}>`,
                                    inline: true,
                                },
                                {
                                    name: "Relative",
                                    value: `\`<t:${epoch.toString()}:R>\`\n<t:${epoch.toString()}:R>`,
                                    inline: true,
                                },

                                {
                                    name: "Time",
                                    value: `Short: \`<t:${epoch.toString()}:t>\` (<t:${epoch.toString()}:t>)\nLong: \`<t:${epoch.toString()}:T>\` (<t:${epoch.toString()}:T>)`,
                                    inline: false,
                                },

                                {
                                    name: "Date",
                                    value: `Short: \`<t:${epoch.toString()}:d>\` (<t:${epoch.toString()}:d>)\nLong: \`<t:${epoch.toString()}:D>\` (<t:${epoch.toString()}:D>)`,
                                    inline: false,
                                },

                                {
                                    name: "Time/Date",
                                    value: `Short: \`<t:${epoch.toString()}:f>\` (<t:${epoch.toString()}:f>)\nLong: \`<t:${epoch.toString()}:F>\` (<t:${epoch.toString()}:F>)`,
                                    inline: false,
                                },
                            ],
                        }),
                    ],
                });
            }),
        );

        buttonEmbed
            .addButton(
                new Button({
                    label: "Reset",
                    style: ButtonStyle.Danger,
                    allowedUsers: [interaction.user.id],
                }),
            )
            .onPressed(async (buttonInteraction) => {
                buttonInteraction.deferUpdate();
                epoch = Math.round(Date.now() / 1000);
                updateEmbed();
                await interaction.editReply(buttonEmbed.getMessageData());
            });

        await interaction.editReply(buttonEmbed.getMessageData());
    },
});
