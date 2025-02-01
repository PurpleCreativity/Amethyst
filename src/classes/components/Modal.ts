import {
    ActionRowBuilder,
    type AnySelectMenuInteraction,
    type ButtonInteraction,
    type ChatInputCommandInteraction,
    type ModalActionRowComponentBuilder,
    ModalBuilder,
    type ModalSubmitInteraction,
    type TextInputBuilder,
} from "discord.js";
import client from "../../main.js";

export type ModalOptions = {
    /**
     * The title of the popup modal
     */
    title: string;

    /**
     * Between 1 and 5 (inclusive) `TextInputBuilders` that make up the modal
     */
    inputs: TextInputBuilder[];
};

export default class Modal {
    /**
     * The `ModalBuilder` instance
     */
    private readonly modal: ModalBuilder;

    /**
     * An array of action rows containing modal components such as text inputs.
     * These rows are added to the modal upon creation.
     */
    private readonly rows: ActionRowBuilder<ModalActionRowComponentBuilder>[] = [];

    /**
     * Initializes a new modal with a title and input components.
     */
    constructor(options: ModalOptions) {
        this.modal = new ModalBuilder().setTitle(options.title).setCustomId(client.Functions.GenerateUUID());

        for (const input of options.inputs) {
            this.rows.push(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input));
        }
    }

    /**
     * Retrieves the constructed modal with all its components added.
     */
    getModal(): ModalBuilder {
        this.modal.addComponents(this.rows);
        return this.modal;
    }

    /**
     * Displays the modal to the user and waits for their response.
     */
    async prompt(
        interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction,
    ): Promise<ModalSubmitInteraction> {
        await interaction.showModal(this.getModal());

        return new Promise((resolve, reject) => {
            const listener = async (newInteraction: ModalSubmitInteraction) => {
                if (newInteraction.customId !== this.modal.data.custom_id) return;

                clearTimeout(timeout);
                resolve(newInteraction);
                client.off("modalSubmitInteraction", listener);
            };

            client.on("modalSubmitInteraction", listener);

            const timeout = setTimeout(() => {
                client.off("modalSubmitInteraction", listener);
                reject(new Error("Modal interaction timed out"));
            }, 300_000); // 5 minutes
        });
    }
}
