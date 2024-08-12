import { ModalBuilder, ActionRowBuilder, type TextInputBuilder, type ModalActionRowComponentBuilder, type Interaction, type ChatInputCommandInteraction, type ButtonInteraction, type ModalSubmitInteraction, type AnySelectMenuInteraction } from "discord.js";
import client from "../index.js";

export type ModalOptions = {
	Title : string;
	Inputs : TextInputBuilder[];	
}

export default class Modal {
    Modal: ModalBuilder;
    Rows : ActionRowBuilder<ModalActionRowComponentBuilder>[] = [];

    constructor(options: ModalOptions) {
        this.Modal = new ModalBuilder().setTitle(options.Title).setCustomId(client.Functions.GenerateID());

        for (const input of options.Inputs) {
            this.Rows.push(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input));
        }
    }

    getModal() {
		this.Modal.addComponents(this.Rows);
		return this.Modal;
	}

    Prompt(interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction ) {
        interaction.showModal(this.getModal());

        return new Promise((resolve, reject) => {
            client.on("modalSubmit", async (newInteraction: ModalSubmitInteraction) => {
                if (newInteraction.customId !== this.Modal.data.custom_id) return;
                
                resolve(newInteraction);
            });
		});
    }
}