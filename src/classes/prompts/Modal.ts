import {
    ActionRowBuilder,
    type AnySelectMenuInteraction,
    type ButtonInteraction,
    type ChatInputCommandInteraction,
    type Interaction,
    type ModalActionRowComponentBuilder,
    ModalBuilder,
    type ModalSubmitInteraction,
    type TextInputBuilder,
} from "discord.js";
import client from "../../main.js";

export type ModalOptions = {
    title: string;
    inputs: TextInputBuilder[];
};

export default class Modal {
    modal: ModalBuilder;
    rows: ActionRowBuilder<ModalActionRowComponentBuilder>[] = [];

    constructor(options: ModalOptions) {
        this.modal = new ModalBuilder().setTitle(options.title).setCustomId(client.Functions.GenerateUUID());

        for (const input of options.inputs) {
            this.rows.push(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input));
        }
    }

    getModal = () => {
        this.modal.addComponents(this.rows);
        return this.modal;
    };

    Prompt = async (
        interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction,
    ): Promise<ModalSubmitInteraction> => {
        await interaction.showModal(this.getModal());

        return new Promise((resolve, reject) => {
            client.on("modalSubmitInteraction", async (newInteraction: ModalSubmitInteraction) => {
                if (newInteraction.customId !== this.modal.data.custom_id) return;

                resolve(newInteraction);
            });
        });
    };
}
