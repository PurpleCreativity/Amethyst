import type { ButtonInteraction, PermissionResolvable } from "discord.js";
import type { ValidPermissions } from "../../types/global.js";

export type StaticButtonOptions = {
    id: string;

    permissions?: ValidPermissions[];
    discord_permissions?: PermissionResolvable[];

    function: (interaction: ButtonInteraction) => Promise<unknown>;
};

export default class StaticButton {
    readonly id: string;

    readonly permissions: ValidPermissions[];
    readonly discord_permissions: PermissionResolvable[];

    private function: (interaction: ButtonInteraction) => Promise<unknown>;

    constructor(options: StaticButtonOptions) {
        this.id = options.id;
        this.permissions = options.permissions || [];
        this.discord_permissions = options.discord_permissions || [];

        this.function = options.function;
    }

    execute = async (interaction: ButtonInteraction) => {
        return await this.function(interaction);
    };
}
