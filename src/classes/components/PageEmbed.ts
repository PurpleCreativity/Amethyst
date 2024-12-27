import {
    type APIEmbedField,
    type ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };
import Button from "./Button.js";
import ButtonEmbed from "./ButtonEmbed.js";
import Embed, { type EmbedOptions } from "./Embed.js";
import Modal from "../prompts/Modal.js";
import client from "../../main.js";

export type PageEmbedOptions = {
    baseEmbed: Embed;
    pageFooter?: boolean;
    fieldsPerPage?: number;
    fields?: APIEmbedField[];
    allowedUsers?: string[];
};

export default class PageEmbed extends ButtonEmbed {
    pageFooter: boolean;
    fieldsPerPage: number;
    embeds: Embed[] = [];
    currentPage = 1;

    forwardButton: Button;
    backButton: Button;

    firstPageButton: Button;
    searchPageButton: Button;
    lastPageButton: Button;

    constructor(opts: PageEmbedOptions) {
        super(opts.baseEmbed);
        this.pageFooter = opts.pageFooter ?? true;
        this.fieldsPerPage = opts.fieldsPerPage ?? 25;

        if (opts.fields) {
            for (let i = 0; i < opts.fields.length; i += this.fieldsPerPage) {
                const embed = EmbedBuilder.from(opts.baseEmbed.data).addFields(
                    opts.fields.slice(i, i + this.fieldsPerPage),
                );
                if (this.pageFooter) {
                    embed.setFooter({
                        text: `Page ${this.embeds.length + 1} of ${Math.ceil(opts.fields.length / this.fieldsPerPage)}`,
                    });
                }
                this.embeds.push(new Embed(embed.data as EmbedOptions));
            }
        }

        this.embed = this.embeds[0];

        this.backButton = this.addButton(
            new Button({
                label: "Back",
                emoji: Emojis.back,
                disabled: true,
                style: ButtonStyle.Primary,
                allowedUsers: opts.allowedUsers,
                function: async (interaction) => {
                    await this.toPage(interaction, this.currentPage - 1);
                },
            }),
        );

        this.forwardButton = this.addButton(
            new Button({
                label: "Forward",
                emoji: Emojis.forward,
                style: ButtonStyle.Primary,
                allowedUsers: opts.allowedUsers,
                function: async (interaction) => {
                    await this.toPage(interaction, this.currentPage + 1);
                },
            }),
        );

        this.nextRow();

        this.firstPageButton = this.addButton(
            new Button({
                label: "Start",
                emoji: Emojis.skip_previous,
                disabled: true,
                style: ButtonStyle.Secondary,
                allowedUsers: opts.allowedUsers,
                function: async (interaction) => {
                    await this.toPage(interaction, 1);
                },
            }),
        );

        this.searchPageButton = this.addButton(
            new Button({
                label: "Search",
                emoji: Emojis.search,
                style: ButtonStyle.Secondary,
                allowedUsers: opts.allowedUsers,
                function: async (interaction) => {
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
                        return await response.editReply({
                            embeds: [
                                client.Functions.makeErrorEmbed({
                                    title: "An error occured while searching",
                                    description: "You must either pass trough a `field_name` or `field_value`!",
                                }),
                            ],
                        });
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
                                        allowedUsers: opts.allowedUsers,
                                        function: async (buttonInteraction) => {
                                            await this.toPage(buttonInteraction, i + 1);
                                            await response.deleteReply();
                                        },
                                    }),
                                );

                                buttonEmbed.addButton(
                                    new Button({
                                        label: "View field",
                                        style: ButtonStyle.Secondary,
                                        allowedUsers: opts.allowedUsers,
                                        function: async (buttonInteraction) => {
                                            await buttonInteraction.reply({
                                                embeds: [
                                                    client.Functions.makeInfoEmbed({
                                                        title: field.name,
                                                        description: field.value,
                                                    }),
                                                ],
                                                ephemeral: true,
                                            });
                                        },
                                    }),
                                );

                                return await response.editReply(buttonEmbed.getMessageData());
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
                },
            }),
        );

        this.lastPageButton = this.addButton(
            new Button({
                label: "End",
                emoji: Emojis.skip_next,
                style: ButtonStyle.Secondary,
                allowedUsers: opts.allowedUsers,
                function: async (interaction) => {
                    await this.toPage(interaction, this.embeds.length);
                },
            }),
        );

        if (this.embeds.length < 2) {
            this.disableButton(this.forwardButton);
            this.disableButton(this.lastPageButton);
        }
    }

    async toPage(interaction: ButtonInteraction, pageNumber: number) {
        this.currentPage = pageNumber;
        this.embed = this.embeds[this.currentPage - 1];

        if (this.currentPage === 1) {
            this.disableButton(this.backButton);
            this.disableButton(this.firstPageButton);
        } else {
            this.enableButton(this.backButton);
            this.enableButton(this.firstPageButton);
        }

        if (this.currentPage === this.embeds.length) {
            this.disableButton(this.forwardButton);
            this.disableButton(this.lastPageButton);
        } else {
            this.enableButton(this.forwardButton);
            this.enableButton(this.lastPageButton);
        }

        await interaction.update(this.getMessageData());
    }
}
