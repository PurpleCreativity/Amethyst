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

    function?(interaction: ButtonInteraction): void | Promise<void>;
};

export default class Button extends ButtonBuilder {
    customId: string;

    private events: {
        pressed: Signal<[ButtonInteraction]>;
    };
    private buttonInteractionListener: (buttonInteraction: ButtonInteraction) => void;

    constructor(options: ButtonOptions) {
        super();

        this.events = {
            pressed: new Signal(),
        };

        this.setLabel(options.label);
        this.setStyle(options.style);
        this.setDisabled(options.disabled ?? false);
        if (options.style === ButtonStyle.Link && options.url) this.setURL(options.url);
        if (options.emoji) this.setEmoji(options.emoji);
        this.customId = options.customId ?? client.Functions.GenerateUUID();
        this.setCustomId(this.customId);

        if (options.function) {
            this.events.pressed.connect(options.function);
        }

        this.buttonInteractionListener = async (interaction: ButtonInteraction) => {
            console.log(
                "total connections",
                this.events.pressed.connectionCount,
                client.listenerCount("buttonInteraction"),
            );
            console.log("buttonInteractionListener", new Date().toISOString().replace("T", " ").replace("Z", ""));
            console.log("listeners", client.listeners("buttonInteraction"));

            if (interaction.customId !== this.customId) return;
            if (
                options.allowedUsers &&
                options.allowedUsers.length > 0 &&
                !options.allowedUsers.includes(interaction.user.id)
            ) {
                await interaction.reply({
                    content: "You are not allowed to use this button",
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            this.events.pressed.fire(interaction);
        };

        client.on("buttonInteraction", this.buttonInteractionListener);
    }

    onPressed(listener: (interaction: ButtonInteraction) => void | Promise<void>): void {
        this.events.pressed.on(listener);
    }

    oncePressed(listener: (interaction: ButtonInteraction) => void | Promise<void>): void {
        this.events.pressed.once(listener);
    }

    destroy(): void {
        this.events.pressed.disconnectAll();
        client.off("buttonInteraction", this.buttonInteractionListener);
    }
}
