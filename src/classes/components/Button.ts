import {
    ButtonBuilder,
    type ButtonInteraction,
    ButtonStyle,
    type ComponentEmojiResolvable,
    MessageFlags,
} from "discord.js";
import client from "../../main.js";
import Signal from "../Signal.js";

/**
 * Options for configuring a Button.
 */
export type ButtonOptions = {
    /** The label text displayed on the button. */
    label: string;

    /** The style of the button. */
    style: ButtonStyle;

    /** Whether the button is disabled. Defaults to `false`. */
    disabled?: boolean;

    /** The URL to open when the button is clicked. Only applicable for link-style buttons. */
    url?: string;

    /** The emoji displayed on the button. */
    emoji?: ComponentEmojiResolvable;

    /** A custom identifier for the button. Defaults to a generated UUID. */
    customId?: string;

    /** An array of user IDs allowed to interact with the button. */
    allowedUsers?: string[];
};

/**
 * A function that filters button interactions.
 * @param interaction The button interaction to evaluate.
 * @returns `true` if the interaction passes the filter; otherwise `false`.
 */
type FilterFunction = (interaction: ButtonInteraction) => boolean;

/**
 * Represents a configurable button with interaction handling and filters.
 */
export default class Button extends ButtonBuilder {
    /** The unique identifier for the button. */
    readonly customId: string;

    /** An array of user IDs allowed to interact with the button. */
    readonly allowedUsers: string[];

    /** Signal to emit events when the button is pressed. */
    private pressed: Signal<[ButtonInteraction]>;

    /** Listener function for button interactions. */
    private listener: (interaction: ButtonInteraction) => Promise<void>;

    /** A map of filter functions associated with unique keys. */
    private filters: Map<string, FilterFunction>;

    /**
     * Creates a new Button instance.
     * @param options The configuration options for the button.
     */
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

    /**
     * Adds a filter function to the button.
     * @param key A unique key to identify the filter.
     * @param filter The filter function to add.
     */
    addFilter(key: string, filter: FilterFunction): this {
        this.filters.set(key, filter);

        return this;
    }

    /**
     * Removes a filter function by its key.
     * @param key The key of the filter to remove.
     * @returns `true` if the filter was removed; otherwise `false`.
     */
    removeFilter(key: string): boolean {
        return this.filters.delete(key);
    }

    /**
     * Clears all filters associated with the button.
     */
    clearFilters(): this {
        this.filters.clear();

        return this;
    }

    /**
     * Registers a listener for the `pressed` signal.
     * @param listener The function to execute when the button is pressed.
     */
    onPressed(listener: (interaction: ButtonInteraction) => void | Promise<void>): this {
        this.pressed.on(listener);

        return this;
    }

    /**
     * Registers a one-time listener for the `pressed` signal.
     * @param listener The function to execute when the button is pressed once.
     */
    oncePressed(listener: (interaction: ButtonInteraction) => void | Promise<void>): this {
        this.pressed.once(listener);

        return this;
    }

    /**
     * Disconnects the button from interaction handling and clears filters and listeners.
     */
    disconnect(): void {
        this.pressed.disconnectAll();
        this.clearFilters();
        client.off("buttonInteraction", this.listener);
    }
}
