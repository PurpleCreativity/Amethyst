import { type APIEmbedField, type ButtonInteraction, ButtonStyle, EmbedBuilder } from "discord.js";
import ButtonEmbed from "./ButtonEmbed.js";

export type PageEmbedOptions = {
    baseEmbed: EmbedBuilder;
    PageFooter?: boolean;
    fieldsPerPage?: number;
    fields?: APIEmbedField[];
    allowedUsers?: string[];
};

export default class PageEmbed extends ButtonEmbed {
    PageFooter: boolean;
    fieldsPerPage: number;
    embeds: EmbedBuilder[] = [];
    currentPage = 1;
    backButton: string;
    nextButton: string;

    constructor(opts: PageEmbedOptions) {
        super(opts.baseEmbed);
        this.PageFooter = opts.PageFooter ?? false;
        this.fieldsPerPage = opts.fieldsPerPage ?? 25;

        if (opts.fields) {
            for (let i = 0; i < opts.fields.length; i += this.fieldsPerPage) {
                const embed = EmbedBuilder.from(opts.baseEmbed.data).addFields(
                    opts.fields.slice(i, i + this.fieldsPerPage),
                );
                if (this.PageFooter) {
                    embed.setFooter({
                        text: `Page ${this.embeds.length + 1} of ${Math.ceil(opts.fields.length / this.fieldsPerPage)}`,
                    });
                }
                this.embeds.push(embed);
            }
        }

        this.Embed = this.embeds[0];

        this.backButton = this.addButton({
            label: "⬅️",
            disabled: true,
            style: ButtonStyle.Primary,
            allowedUsers: opts.allowedUsers,
            function: (interaction) => {
                this.previousPage(interaction);
            },
        });

        this.nextButton = this.addButton({
            label: "➡️",
            style: ButtonStyle.Primary,
            allowedUsers: opts.allowedUsers,
            function: (interaction) => {
                this.nextPage(interaction);
            },
        });

        if (this.embeds.length < 2) {
            this.disableButton(this.nextButton);
        }
    }

    async previousPage(interaction: ButtonInteraction) {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.Embed = this.embeds[this.currentPage - 1];
            if (this.currentPage === 1) {
                this.disableButton(this.backButton);
            }
            this.enableButton(this.nextButton);
            await interaction.update(this.getMessageData());
        }
    }

    async nextPage(interaction: ButtonInteraction) {
        if (this.currentPage < this.embeds.length) {
            this.currentPage++; // Becomes 2
            this.Embed = this.embeds[this.currentPage - 1];
            if (this.currentPage === this.embeds.length) {
                this.disableButton(this.nextButton);
            }
            this.enableButton(this.backButton);
            await interaction.update(this.getMessageData());
        }
    }
}
