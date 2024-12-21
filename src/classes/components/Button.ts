import { ButtonBuilder, type ButtonInteraction, ButtonStyle, type ComponentEmojiResolvable } from "discord.js";
import client from "../../main.js";

export type ButtonOptions = {
    label: string;
    style: ButtonStyle;
    disabled?: boolean;
    url?: string;
    emoji?: ComponentEmojiResolvable;
    customId?: string;
    allowedUsers?: string[];

    function?(interaction: ButtonInteraction): unknown | Promise<unknown>;
};

export default class Button extends ButtonBuilder {
    customId: string;

    constructor(options: ButtonOptions) {
        super();

        this.setLabel(options.label);
        this.setStyle(options.style);
        this.setDisabled(options.disabled ?? false);
        if (options.style === ButtonStyle.Link && options.url) this.setURL(options.url);
        if (options.emoji) this.setEmoji(options.emoji);
        this.customId = options.customId ?? client.Functions.GenerateUUID();
        this.setCustomId(this.customId);

        if (options.function) {
            client.on("buttonInteraction", async (interaction: ButtonInteraction) => {
                if (!options.function) return;
                if (interaction.customId !== this.customId) return;
                if (options.allowedUsers && options.allowedUsers.length > 0 && !options.allowedUsers.includes(interaction.user.id)) {
                    await interaction.reply({
                        content: "You are not allowed to use this button",
                        ephemeral: true,
                    });
                    return;
                }

                return await options.function(interaction);
            });
        }
    }
}
