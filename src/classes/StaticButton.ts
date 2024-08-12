import type { ButtonInteraction, PermissionResolvable } from "discord.js";
import type { customPermissionOptions } from "./SlashCommand.js";

export type StaticButtonOptions = {
    customId: string;

    permissions?: PermissionResolvable[];
    customPermissions?: customPermissionOptions[];

    execute: (interaction: ButtonInteraction) => Promise<any>;
}

export default class StaticButton {
    customId: string;

    permissions: PermissionResolvable[];
    customPermissions: customPermissionOptions[];

    execute: (interaction: ButtonInteraction) => Promise<any>;

    constructor(opts: StaticButtonOptions) {
        this.customId = opts.customId;

        this.permissions = opts.permissions ?? [];
        this.customPermissions = opts.customPermissions ?? [];

        this.execute = opts.execute;
    }

    async Check(interaction: ButtonInteraction) {
        
    }

    async Execute(interaction: ButtonInteraction) {
        this.execute(interaction);
    }
}