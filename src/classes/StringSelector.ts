import { ActionRowBuilder, type AnySelectMenuInteraction, type ButtonInteraction, ButtonStyle, type ChatInputCommandInteraction, ComponentType, type EmbedBuilder, StringSelectMenuBuilder, type StringSelectMenuInteraction, type StringSelectMenuOptionBuilder } from "discord.js"
import client from "../index.js"
import ButtonEmbed from "./ButtonEmbed.js"
import Emojis from "../assets/Emojis.js"

export type StringSelectorOptions = {
    Placeholder: string,

    Options: StringSelectMenuOptionBuilder[],

    MaxValues?: number
    MinValues?: number

    allowedUsers?: string[]
}

export default class StringSelector {
    Selector: StringSelectMenuBuilder
    Options: StringSelectMenuOptionBuilder[] = [];
    allowedUsers: string[] = [];

    constructor(options: StringSelectorOptions) {
        this.Selector = new StringSelectMenuBuilder().setPlaceholder(options.Placeholder).setCustomId(client.Functions.GenerateID()).setMaxValues(options.MaxValues || 1).setMinValues(options.MinValues || 1);

		for (const option of options.Options) this.Options.push(option);
        this.allowedUsers = options.allowedUsers || [];
    }

    getSelector() {
        this.Selector.setOptions(this.Options);

        return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(this.Selector);
    }

    async Prompt(interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction, embed: EmbedBuilder): Promise<{ values?: string[], interaction: ButtonInteraction }> {
        let responseValues = undefined as string[] | undefined;

        embed.setFields([ { name: "Selected", value: "\`(None)\`" } ]);
        const buttonEmbed = new ButtonEmbed(embed);

        const submitButton = buttonEmbed.addButton({
            label: "Submit",
            style: ButtonStyle.Success,
            emoji: Emojis.upload,
            allowedUsers: this.allowedUsers,
            customId: `${this.Selector.data.custom_id}_SUBMIT`,
        })

        const cancelButton = buttonEmbed.addButton({
            label: "Cancel",
            style: ButtonStyle.Danger,
            emoji: Emojis.delete,
            allowedUsers: this.allowedUsers,
            customId: `${this.Selector.data.custom_id}_CANCEL`,
        })

        if (this.Selector.data.min_values && this.Selector.data.min_values >= 1) buttonEmbed.disableButton(submitButton);;

        const components = [] as any;
        components.push(this.getSelector());
        for (const row of buttonEmbed.Rows) components.push({ type: ComponentType.ActionRow, components: row });

        if (interaction.deferred) {
            await interaction.editReply({ embeds: [embed], components: components });
        } else {
            await interaction.reply({ embeds: [embed], components: components });
        }

        client.on("selectMenu", async (newInteraction: AnySelectMenuInteraction) => {
            if (!newInteraction.isStringSelectMenu()) return;
            if (newInteraction.customId !== this.Selector.data.custom_id) return;
            if (this.allowedUsers.length > 0 && !this.allowedUsers.includes(newInteraction.user.id)) {
                await newInteraction.reply({ content: "You are not allowed to use this menu", ephemeral: true });
                return;
            }

            responseValues = newInteraction.values;
            buttonEmbed.enableButton(submitButton);
            await newInteraction.deferUpdate();
            embed.setFields([ { name: "Selected", value: responseValues.map(value => `\`${value}\``).join(", ") || "\`(None)\`" } ]);
            interaction.editReply({ embeds: [embed], components: components });
        })

        return new Promise((resolve, reject) => {
            client.on("buttonPress", async (newInteraction: ButtonInteraction) => {
                if (newInteraction.customId !== submitButton && newInteraction.customId !== cancelButton) return;
                if (this.allowedUsers.length > 0 && !this.allowedUsers.includes(newInteraction.user.id)) {
                    await newInteraction.reply({ content: "You are not allowed to use this button", ephemeral: true });
					return;
                };

                if (newInteraction.customId === submitButton && responseValues === undefined) responseValues = [];
                const values = newInteraction.customId === submitButton ? responseValues : undefined;

                await interaction.deleteReply();

                resolve({
                    values: values,
                    interaction: newInteraction,
                });
            })
        });
    }
}