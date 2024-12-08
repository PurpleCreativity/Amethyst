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
     * - https://discord-api-types.dev/api/discord-api-types-v10/interface/APIModalInteractionResponseCallbackData#title
     */
    title: string;

    /**
     * Between 1 and 5 (inclusive) [TextInputBuilders](https://discord.js.org/docs/packages/builders/main/TextInputBuilder:Class) that make up the modal
     * - https://discord-api-types.dev/api/discord-api-types-v10/interface/APIModalInteractionResponseCallbackData#components
     */
    inputs: TextInputBuilder[];
};

export default class Modal {
    /**
     * The [ModalBuilder](https://discord.js.org/docs/packages/builders/main/ModalBuilder:Class) instance
     */
    modal: ModalBuilder;

    /**
     * An array of action rows containing modal components such as text inputs.
     * These rows are added to the modal upon creation.
     */
    rows: ActionRowBuilder<ModalActionRowComponentBuilder>[] = [];

    /**
     * Initializes a new modal with a title and input components.
     *
     * @param {ModalOptions} options - Configuration options for the modal, including title and inputs.
     */
    constructor(options: ModalOptions) {
        this.modal = new ModalBuilder().setTitle(options.title).setCustomId(client.Functions.GenerateUUID());

        for (const input of options.inputs) {
            this.rows.push(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input));
        }
    }

    /**
     * Retrieves the constructed modal with all its components added.
     *
     * @returns {ModalBuilder} The fully configured [ModalBuilder](https://discord.js.org/docs/packages/builders/main/ModalBuilder:Class) instance.
     */
    getModal = (): ModalBuilder => {
        this.modal.addComponents(this.rows);
        return this.modal;
    };

    /**
     * Displays the modal to the user and waits for their response.
     *
     * @param {ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction} interaction
     * The interaction that triggered the modal prompt. Can be a chat command, button, or select menu interaction.
     *
     * @returns {Promise<ModalSubmitInteraction>} A promise that resolves with the modal submit interaction
     * when the user submits the modal.
     */
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
