import type { ButtonInteraction, PermissionResolvable } from "discord.js";
import type { ValidPermissions } from "../../types/core/Interactables.js";
import type GuildProfile from "../database/GuildProfile.js";

export type StaticButtonOptions = {
    id: string;

    permissions?: ValidPermissions[];
    discordPermissions?: PermissionResolvable[];

    function(interaction: ButtonInteraction, guildProfile?: GuildProfile): Promise<unknown>;
};

export default class StaticButton {
    readonly id: string;

    readonly permissions: ValidPermissions[];
    readonly discordPermissions: PermissionResolvable[];

    private function: (interaction: ButtonInteraction, guildProfile?: GuildProfile) => Promise<unknown>;

    constructor(options: StaticButtonOptions) {
        this.id = options.id;
        this.permissions = options.permissions || [];
        this.discordPermissions = options.discordPermissions || [];

        this.function = options.function;
    }

    async execute(interaction: ButtonInteraction, guildProfile?: GuildProfile) {
        return await this.function(interaction, guildProfile);
    }
}
