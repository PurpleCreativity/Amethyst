import {
    ButtonBuilder,
    type ButtonInteraction,
    ButtonStyle,
    type ComponentEmojiResolvable,
    MessageFlags,
} from "discord.js";
import client from "../../main.js";
import Signal from "../Signal.js";

export type ButtonOptions = {
    label: string;
    style: ButtonStyle;
    disabled?: boolean;
    url?: string;
    emoji?: ComponentEmojiResolvable;
    customId?: string;
    allowedUsers?: string[];
};

type FilterFunction = (interaction: ButtonInteraction) => boolean;

export default class Button extends ButtonBuilder {
    readonly customId: string;
    readonly allowedUsers: string[];

    private pressed: Signal<[ButtonInteraction]>;
    private listener: (interaction: ButtonInteraction) => Promise<void>;

    private filters: Map<string, FilterFunction>;

    constructor(options: ButtonOptions) {
        super();

        this.setLabel(options.label);
        this.setStyle(options.style);
        this.setDisabled(options.disabled ?? false);
        if (options.style === ButtonStyle.Link && options.url) this.setURL(options.url);
        if (options.emoji) this.setEmoji(options.emoji);

        this.customId = options.customId ?? client.Functions.GenerateUUID();
        this.setCustomId(this.customId);

        this.allowedUsers = options.allowedUsers ?? [];
        this.pressed = new Signal();

        this.filters = new Map();
        this.listener = async (interaction: ButtonInteraction) => {
            if (interaction.customId !== this.customId) return;

            if (this.allowedUsers.length > 0 && !this.allowedUsers.includes(interaction.user.id)) {
                await interaction.reply({
                    content: "You are not allowed to use this button",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            for (const filter of this.filters.values()) {
                if (!filter(interaction)) {
                    await interaction.reply({
                        content: "You are not allowed to use this button",
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }
            }

            this.pressed.fire(interaction);
        };

        client.on("buttonInteraction", this.listener);
    }

    addFilter(key: string, filter: FilterFunction): void {
        this.filters.set(key, filter);
    }

    removeFilter(key: string): boolean {
        return this.filters.delete(key);
    }

    clearFilters(): void {
        this.filters.clear();
    }

    onPressed(listener: (interaction: ButtonInteraction) => void | Promise<void>): void {
        this.pressed.on(listener);
    }

    oncePressed(listener: (interaction: ButtonInteraction) => void | Promise<void>): void {
        this.pressed.once(listener);
    }

    disconnect(): void {
        this.pressed.disconnectAll();
        this.clearFilters();
        client.off("buttonInteraction", this.listener);
    }
}
