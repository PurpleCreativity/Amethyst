import { type APIButtonComponentWithCustomId, type ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import type Button from "./Button.js";
import Embed, { type EmbedOptions } from "./Embed.js";

export default class ButtonEmbed {
    embed: Embed;
    ephemeral: boolean;
    currentRow = 1;
    rows: ButtonBuilder[][] = [];

    constructor(embed: Embed) {
        this.embed = new Embed(embed.data as EmbedOptions);
        this.rows[0] = [];
        this.ephemeral = false;
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
        this.rows[this.currentRow - 1].push(button);

        return button;
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

    disableButton(buttonObject: Button) {
        for (const row of this.rows) {
            for (const button of row) {
                if (button.data.style === ButtonStyle.Link) continue;
                const real = button.data as APIButtonComponentWithCustomId;
                if (real.custom_id === buttonObject.customId) {
                    button.setDisabled(true);
                }
            }
        }
    }

    enableButton(buttonObject: Button) {
        for (const row of this.rows) {
            for (const button of row) {
                if (button.data.style === ButtonStyle.Link) continue;
                const real = button.data as APIButtonComponentWithCustomId;
                if (real.custom_id === buttonObject.customId) {
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
