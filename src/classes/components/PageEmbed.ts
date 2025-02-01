//! Rewrite to support being ephemeral

import {
    type APIEmbedField,
    ButtonStyle,
    type Message,
    MessageFlags,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };
import client from "../../main.js";
import Button from "./Button.js";
import ButtonEmbed from "./ButtonEmbed.js";
import Embed, { type EmbedOptions } from "./Embed.js";
import Modal from "./Modal.js";

export type PageEmbedOptions = {
    baseEmbed: Embed;
    fields: APIEmbedField[];

    fieldsPerPage?: number;
    pageFooter?: boolean;

    allowedUsers?: string[];
};

export default class PageEmbed extends ButtonEmbed {
    readonly pageFooter: boolean;
    readonly fieldsPerPage: number;
    private embeds: Embed[] = [];
    private currentPage = 1;

    private forwardButton: Button;
    private backButton: Button;

    private firstPageButton: Button;
    private searchPageButton: Button;
    private lastPageButton: Button;

    constructor(options: PageEmbedOptions) {
        super(options.baseEmbed);

        this.pageFooter = options.pageFooter ?? true;
        this.fieldsPerPage = options.fieldsPerPage ?? 25;

        for (let i = 0; i < options.fields.length; i += this.fieldsPerPage) {
            const embed = Embed.from(options.baseEmbed.data).addFields(options.fields.slice(i, i + this.fieldsPerPage));
            if (this.pageFooter) {
                embed.setFooter({
                    text: `Page ${this.embeds.length + 1} of ${Math.ceil(options.fields.length / this.fieldsPerPage)}`,
                });
            }
            this.embeds.push(new Embed(embed.data as EmbedOptions));
        }

        this.embed = this.embeds[0];

        this.backButton = this.addButton(
            new Button({
                label: "Back",
                emoji: Emojis.back,
                disabled: true,
                style: ButtonStyle.Primary,
                allowedUsers: options.allowedUsers,
            }).onPressed(async (interaction) => {
                await this.toPage(interaction.message, this.currentPage - 1);
                await interaction.deferUpdate();
            }),
        );

        this.forwardButton = this.addButton(
            new Button({
                label: "Forward",
                emoji: Emojis.forward,
                style: ButtonStyle.Primary,
                allowedUsers: options.allowedUsers,

                timeout: 60_000,
            }).onPressed(async (interaction) => {
                await this.toPage(interaction.message, this.currentPage + 1);
                await interaction.deferUpdate();
            }),
        );

        this.nextRow();

        this.firstPageButton = this.addButton(
            new Button({
                label: "Start",
                emoji: Emojis.skip_previous,
                disabled: true,
                style: ButtonStyle.Secondary,
                allowedUsers: options.allowedUsers,
            }).onPressed(async (interaction) => {
                await this.toPage(interaction.message, 1);
                await interaction.deferUpdate();
            }),
        );

        this.searchPageButton = this.addButton(
            new Button({
                label: "Search",
                emoji: Emojis.search,
                style: ButtonStyle.Secondary,
                allowedUsers: options.allowedUsers,
            }).onPressed(async (interaction) => {
                const modal = new Modal({
                    title: "Search",
                    inputs: [
                        new TextInputBuilder()
                            .setCustomId("field_name")
                            .setLabel("A field's name")
                            .setMaxLength(256)
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false),

                        new TextInputBuilder()
                            .setCustomId("field_value")
                            .setLabel("A field's value")
                            .setMaxLength(1024)
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false),
                    ],
                });

                const response = await modal.prompt(interaction);
                await response.deferReply();

                const lookName = response.fields.getTextInputValue("field_name");
                const lookValue = response.fields.getTextInputValue("field_value");

                if (lookName.length === 0 && lookValue.length === 0) {
                    await response.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occured while searching",
                                description: "You must either pass trough a `field_name` or `field_value`!",
                            }),
                        ],
                    });
                    return;
                }

                // forEach is the devil
                for (let i = 0; i < this.embeds.length; i++) {
                    const embed = this.embeds[i];

                    const fields = embed.data.fields ?? [];
                    for (let j = 0; j < fields.length; j++) {
                        const field = fields[j];

                        if (
                            (lookName && field.name.includes(lookName)) ||
                            (lookValue && field.value.includes(lookValue))
                        ) {
                            const buttonEmbed = new ButtonEmbed(
                                client.Functions.makeInfoEmbed({
                                    title: "Field found",
                                    description: `The field was found on **Page ${i + 1}**, Field #${j + 1}.`,
                                }),
                            );

                            buttonEmbed.addButton(
                                new Button({
                                    label: "Jump to page",
                                    style: ButtonStyle.Primary,
                                    allowedUsers: options.allowedUsers,
                                }).oncePressed(async (buttonInteraction) => {
                                    await this.toPage(interaction.message, i + 1);
                                    await response.deleteReply();
                                }),
                            );

                            const viewFieldButton = buttonEmbed.addButton(
                                new Button({
                                    label: "View field",
                                    style: ButtonStyle.Secondary,
                                    allowedUsers: options.allowedUsers,
                                }).oncePressed(async (buttonInteraction) => {
                                    viewFieldButton.setDisabled(true);
                                    await response.editReply(buttonEmbed.getMessageData());

                                    await buttonInteraction.reply({
                                        embeds: [
                                            client.Functions.makeInfoEmbed({
                                                title: field.name,
                                                description: field.value,
                                            }),
                                        ],
                                        flags: MessageFlags.Ephemeral,
                                    });
                                }),
                            );

                            await response.editReply(buttonEmbed.getMessageData());
                            return;
                        }
                    }
                }

                await response.editReply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "No Results",
                            description: "No fields matching your search criteria were found.",
                        }),
                    ],
                });
            }),
        );

        this.lastPageButton = this.addButton(
            new Button({
                label: "End",
                emoji: Emojis.skip_next,
                style: ButtonStyle.Secondary,
                allowedUsers: options.allowedUsers,
            }).onPressed(async (interaction) => {
                await this.toPage(interaction.message, this.embeds.length);
                await interaction.deferUpdate();
            }),
        );
    }

    private async toPage(message: Message, pageNumber: number) {
        if (!message.channel) throw new Error("PageEmbed is only avaible in channels.");

        this.currentPage = pageNumber;
        this.embed = this.embeds[this.currentPage - 1];

        if (this.currentPage === 1) {
            this.backButton.setDisabled(true);
            this.firstPageButton.setDisabled(true);
        } else {
            this.backButton.setDisabled(false);
            this.firstPageButton.setDisabled(false);
        }

        if (this.currentPage === this.embeds.length) {
            this.forwardButton.setDisabled(true);
            this.lastPageButton.setDisabled(true);
        } else {
            this.forwardButton.setDisabled(false);
            this.lastPageButton.setDisabled(false);
        }

        await message.edit(this.getMessageData());
    }
}
