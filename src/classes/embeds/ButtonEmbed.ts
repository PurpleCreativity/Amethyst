import {
    type APIButtonComponentWithCustomId,
    ButtonBuilder,
    type ButtonInteraction,
    ButtonStyle,
    type ComponentEmojiResolvable,
    ComponentType,
    type EmbedBuilder,
} from "discord.js";
import client from "../../main.js";
import Embed, { type EmbedOptions } from "./Embed.js";

export type Button = {
    label: string;
    style: ButtonStyle;
    disabled?: boolean;
    allowedUsers?: string[];
    link?: string;
    emoji?: ComponentEmojiResolvable;
    customId?: string;

    function?: (interaction: ButtonInteraction) => unknown | Promise<unknown>;
};

export default class ButtonEmbed extends Embed {
    embed: Embed;
    ephemeral: boolean;
    currentRow = 1;
    rows: ButtonBuilder[][] = [];

    constructor(embed: EmbedBuilder, buttons?: Button[]) {
        super({});

        this.embed = new Embed(embed.data as EmbedOptions);
        this.rows[0] = [];
        this.ephemeral = false;

        if (buttons) this.setButtons(buttons);
    }

    getMessageData() {
        if (this.rows.length === 0 || this.rows.every((row) => row.length === 0)) {
            return {
                ephemeral: this.ephemeral,
                embeds: [this.embed],
                components: [],
            };
        }

        const components = [];
        for (let i = 0; i < this.rows.length; i++) {
            if (this.rows[i].length === 0) continue;
            components.push({
                type: ComponentType.ActionRow,
                components: this.rows[i],
            });
        }

        return {
            ephemeral: this.ephemeral,
            embeds: [this.embed],
            components: components.length > 0 ? components : undefined,
        };
    }

    addButton(button: Button) {
        const id = button.customId || client.Functions.GenerateUUID();

        if (button.style === ButtonStyle.Link && button.link !== undefined) {
            this.rows[this.currentRow - 1].push(
                new ButtonBuilder().setLabel(button.label).setStyle(button.style).setURL(button.link),
            );
            return id;
        }

        const Bbutton = new ButtonBuilder()
            .setLabel(button.label)
            .setStyle(button.style)
            .setCustomId(id)
            .setDisabled(button.disabled ?? false);
        if (button.emoji) Bbutton.setEmoji(button.emoji);

        this.rows[this.currentRow - 1].push(Bbutton);

        if (button.function) {
            client.on("buttonInteraction", async (interaction: ButtonInteraction) => {
                if (!button.function) return;

                if (interaction.customId === id) {
                    if (
                        button.allowedUsers &&
                        button.allowedUsers.length > 0 &&
                        !button.allowedUsers.includes(interaction.user.id)
                    ) {
                        await interaction.reply({
                            content: "You are not allowed to use this button",
                            ephemeral: true,
                        });
                        return;
                    }

                    await button.function(interaction);
                }
            });
        }
        return id;
    }

    setButtons(buttons: Button[]) {
        if (buttons.length === 0) {
            this.rows = [[]];
            return;
        }

        if (this.rows[this.currentRow - 1] === undefined) {
            this.rows[this.currentRow - 1] = [];
        }
        for (let i = 0; i < buttons.length; i++) {
            this.addButton(buttons[i]);
        }
    }

    disableButton(id: string) {
        for (const row of this.rows) {
            for (const button of row) {
                if (button.data.style === ButtonStyle.Link) continue;
                const real = button.data as APIButtonComponentWithCustomId;
                if (real.custom_id === id) {
                    button.setDisabled(true);
                }
            }
        }
    }

    enableButton(id: string) {
        for (const row of this.rows) {
            for (const button of row) {
                if (button.data.style === ButtonStyle.Link) continue;
                const real = button.data as APIButtonComponentWithCustomId;
                if (real.custom_id === id) {
                    button.setDisabled(false);
                }
            }
        }
    }

    nextRow() {
        this.currentRow++;
        this.rows[this.currentRow - 1] = [];
    }
}
