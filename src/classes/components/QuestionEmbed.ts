/*

import { AnySelectMenuInteraction, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction } from "discord.js";
import Button from "./Button.js";
import ButtonEmbed from "./ButtonEmbed.js";
import type Embed from "./Embed.js";
import Emojis from "../../../public/Emojis.json" with { type: "json" };

export type QuestionEmbedOptions = {
    baseEmbed: Embed;
    allowedUsers?: string[];

    yesButtonLabel?: string;
    noButtonLabel?: string;
};

export enum QuestionEmbedResponse {
    Yes = 0,
    No = 1,
}

export default class QuestionEmbed extends ButtonEmbed {
    yesButton: Button;
    noButton: Button;

    constructor(options: QuestionEmbedOptions) {
        super(options.baseEmbed);

        this.yesButton = this.addButton(
            new Button({
                label: options.yesButtonLabel ?? "Yes",
                emoji: Emojis.check2,
                style: ButtonStyle.Success,
                allowedUsers: options.allowedUsers,
            }),
        );

        this.noButton = this.addButton(
            new Button({
                label: options.noButtonLabel ?? "No",
                emoji: Emojis.close2,
                style: ButtonStyle.Success,
                allowedUsers: options.allowedUsers,
            }),
        );
    }

    async Prompt(
        interaction: ChatInputCommandInteraction | ButtonInteraction | AnySelectMenuInteraction,
        embed: Embed,
    ) {
        return new Promise((resolve, reject) => {
            
        })
    }
}


*/
