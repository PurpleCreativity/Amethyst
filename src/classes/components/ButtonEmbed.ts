import { ComponentType } from "discord.js";
import type Button from "./Button.js";
import type Embed from "./Embed.js";

export default class ButtonEmbed {
    embed: Embed;
    rows: Button[][] = [];
    currentRow = 1;

    constructor(baseEmbed: Embed) {
        this.embed = baseEmbed;
    }

    getMessageData() {
        if (this.rows.length === 0 || this.rows.every((row) => row.length === 0)) {
            return {
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

    nextRow() {
        this.currentRow++;
        this.rows[this.currentRow - 1] = [];
    }
}
