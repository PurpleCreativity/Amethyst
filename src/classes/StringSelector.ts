import { ActionRowBuilder, type AnySelectMenuInteraction, type ButtonInteraction, type ChatInputCommandInteraction, StringSelectMenuBuilder, type StringSelectMenuInteraction, type StringSelectMenuOptionBuilder } from "discord.js"
import client from "../index.js"

export type StringSelectorOptions = {
    Placeholder: string,

    Options: StringSelectMenuOptionBuilder[],

    MaxValues?: number
    MinValues?: number

    allowedUsers?: string[]
}

type messageData = {
    content?: string
    embeds?: any[]
    components?: any[]
    ephemeral?: boolean
}

export default class StringSelector {
    Selector: StringSelectMenuBuilder
    Options: StringSelectMenuOptionBuilder[] = [];
    allowedUsers: string[] = [];

    constructor(options: StringSelectorOptions) {
        this.Selector = new StringSelectMenuBuilder().setPlaceholder(options.Placeholder).setCustomId(client.Functions.GenerateID()).setMaxValues(options.MaxValues || 1).setMinValues(options.MinValues || 1);

		for (const option of options.Options) this.Options.push(option);
    }

    getSelector() {
        this.Selector.setOptions(this.Options);

        return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(this.Selector);
    }

    async Prompt(interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction, messageData: messageData, rowPosition?: number) {
        const actualComponents = []
        actualComponents.push(this.getSelector());
        for (const row of messageData.components || []) actualComponents.push(row);
        messageData.components = actualComponents;

        await interaction.reply(messageData);

        return new Promise((resolve, reject) => {
            client.on("selectMenu", async (newInteraction: AnySelectMenuInteraction) => {
                if (!newInteraction.isStringSelectMenu()) return;
                if (newInteraction.customId !== this.Selector.data.custom_id) return;
                if (this.allowedUsers.length > 0 && !this.allowedUsers.includes(newInteraction.user.id)) {
                    newInteraction.reply({ content: "You are not allowed to use this selector", ephemeral: true });
                    return;
                }

                resolve(newInteraction as StringSelectMenuInteraction);
            })
        });
    }
}