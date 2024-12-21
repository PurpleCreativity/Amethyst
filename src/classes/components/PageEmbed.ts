import { type APIEmbedField, type ButtonInteraction, ButtonStyle, EmbedBuilder } from "discord.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };
import Button from "./Button.js";
import ButtonEmbed from "./ButtonEmbed.js";
import Embed, { type EmbedOptions } from "./Embed.js";

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
