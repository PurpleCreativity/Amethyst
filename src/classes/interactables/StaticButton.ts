import type { ButtonInteraction, PermissionResolvable } from "discord.js";
import type { ValidPermissions } from "../../types/shared.js";
import type GuildProfile from "../database/GuildProfile.js";

export type StaticButtonOptions = {
    id: string;

    permissions?: ValidPermissions[];
    discord_permissions?: PermissionResolvable[];

    function: (interaction: ButtonInteraction, guildProfile?: GuildProfile) => Promise<unknown>;
};

export default class StaticButton {
    readonly id: string;

    readonly permissions: ValidPermissions[];
    readonly discord_permissions: PermissionResolvable[];

    private function: (interaction: ButtonInteraction, guildProfile?: GuildProfile) => Promise<unknown>;

    constructor(options: StaticButtonOptions) {
        this.id = options.id;
        this.permissions = options.permissions || [];
        this.discord_permissions = options.discord_permissions || [];

        this.function = options.function;
    }

    execute = async (interaction: ButtonInteraction, guildProfile?: GuildProfile) => {
        return await this.function(interaction, guildProfile);
    };
}
