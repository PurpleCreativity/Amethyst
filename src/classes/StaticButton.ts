import { GuildMember, type ButtonInteraction, type PermissionResolvable } from "discord.js";
import type { customPermissionOptions } from "./SlashCommand.js";
import client from "../index.js";

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
        if (!interaction.member) return false;
		if (this.permissions.length === 0 && this.customPermissions.length === 0) return true;
        if (interaction.guild) {
			if (this.customPermissions.length > 0) {
				if (!(interaction.member instanceof GuildMember)) return false;
				const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);
                if (!guildDataProfile) return false;

				const check = await guildDataProfile.customPermissionCheck(interaction.member, this.customPermissions);
				
				if (!check) return false;
			}
		}
        if (typeof interaction.member.permissions === "string" || !interaction.member.permissions.has(this.permissions)) return false;
        
        return true;
    }

    async Execute(interaction: ButtonInteraction) {
        if (client.Functions.isDev(interaction.user.id)) {
			await this.execute(interaction);
			return;
		}

        if (!(await this.Check(interaction))) {
			return interaction.reply({ content: "You do not have permission to use this button.", ephemeral: true });
		}

        this.execute(interaction);
    }
}