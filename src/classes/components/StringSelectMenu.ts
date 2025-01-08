import {
    type APIActionRowComponent,
    type APIButtonComponent,
    type APISelectMenuComponent,
    ActionRow,
    ActionRowBuilder,
    type AnySelectMenuInteraction,
    type ButtonInteraction,
    ButtonStyle,
    type ChatInputCommandInteraction,
    ComponentType,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuComponent,
    type StringSelectMenuOptionBuilder,
} from "discord.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };
import client from "../../main.js";
import Button from "./Button.js";
import ButtonEmbed from "./ButtonEmbed.js";
import type Embed from "./Embed.js";

export type StringSelectMenuOptions = {
    placeholder: string;

    options: StringSelectMenuOptionBuilder[];

    maxValues: number;
    minValues: number;

    disabled?: boolean;
    customId?: string;

    allowedUsers?: string[];
};

export default class StringSelectMenu {
    selector: StringSelectMenuBuilder;
    options: StringSelectMenuOptionBuilder[];
    allowedUsers: string[];

    constructor(options: StringSelectMenuOptions) {
        this.selector = new StringSelectMenuBuilder()
            .setPlaceholder(options.placeholder)
            .setCustomId(options.customId || client.Functions.GenerateUUID())
            .setMaxValues(options.maxValues)
            .setMinValues(options.minValues)
            .setDisabled(options.disabled ?? false);

        this.allowedUsers = options.allowedUsers || [];
        this.options = options.options;
    }

    getSelector() {
        this.selector.setOptions(this.options);

        return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(this.selector);
    }

    async prompt(
        interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction,
        embed: Embed,
    ) {
        let responseValues: string[] = [];

        const buttonEmbed = new ButtonEmbed(embed);
        buttonEmbed.embed.setField(
            "Selected",
            responseValues.map((value) => `\`${value}\``).join(", ") || "`(None)`",
            false,
        );

        const submitButton = buttonEmbed.addButton(
            new Button({
                label: "Submit",
                style: ButtonStyle.Success,
                emoji: Emojis.upload,
                allowedUsers: this.allowedUsers,
                customId: `${this.selector.data.custom_id}_SUBMIT`,
                disabled: !!(this.selector.data.min_values && this.selector.data.min_values >= 1),
            }),
        );

        const cancelButton = buttonEmbed.addButton(
            new Button({
                label: "Cancel",
                style: ButtonStyle.Danger,
                emoji: Emojis.delete,
                allowedUsers: this.allowedUsers,
                customId: `${this.selector.data.custom_id}_CANCEL`,
            }),
        );

        const components: APIActionRowComponent<APIButtonComponent | APISelectMenuComponent>[] = [];
        // @ts-ignore
        components.push(this.getSelector());
        // @ts-ignore
        for (const row of buttonEmbed.rows) components.push({ type: ComponentType.ActionRow, components: row });

        client.on("selectMenu", async (newInteraction: AnySelectMenuInteraction) => {
            if (!newInteraction.isStringSelectMenu()) return;
            if (newInteraction.customId !== this.selector.data.custom_id) return;
            if (this.allowedUsers.length > 0 && !this.allowedUsers.includes(newInteraction.user.id)) {
                await newInteraction.reply({
                    content: "You are not allowed to use this menu",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            responseValues = newInteraction.values;
            buttonEmbed.embed.setField(
                "Selected",
                responseValues.map((value) => `\`${value}\``).join(", ") || "`(None)`",
                false,
            );

            interaction.editReply({ embeds: [embed], components: components });
        });

        return new Promise((resolve, reject) => {
            client.on("buttonPress", async (newInteraction: ButtonInteraction) => {
                if (
                    newInteraction.customId !== submitButton.customId &&
                    newInteraction.customId !== cancelButton.customId
                )
                    return;
                if (this.allowedUsers.length > 0 && !this.allowedUsers.includes(newInteraction.user.id)) {
                    await newInteraction.reply({
                        content: "You are not allowed to use this button",
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }

                if (newInteraction.customId === submitButton.customId && responseValues === undefined)
                    responseValues = [];
                const values = newInteraction.customId === submitButton.customId ? responseValues : undefined;

                await interaction.deleteReply();

                resolve({
                    values: values,
                    interaction: newInteraction,
                });
            });
        });
    }
}
