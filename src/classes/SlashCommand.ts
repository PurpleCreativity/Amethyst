import { type AutocompleteInteraction, type ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, type PermissionResolvable, type SlashCommandAttachmentOption, type SlashCommandBooleanOption, type SlashCommandChannelOption, type SlashCommandIntegerOption, type SlashCommandMentionableOption, type SlashCommandNumberOption, type SlashCommandRoleOption, type SlashCommandStringOption, type SlashCommandSubcommandBuilder, GuildMember } from "discord.js";
import client from "../index.js";

export type ValidOptions =
 | SlashCommandStringOption
 | SlashCommandNumberOption
 | SlashCommandIntegerOption
 | SlashCommandBooleanOption
 | SlashCommandRoleOption
 | SlashCommandChannelOption
 | SlashCommandMentionableOption
 | SlashCommandAttachmentOption;

export type ValidModules =
 | "Moderation"
 | "Utility"
 | "Points"
 | "Schedule"

export type customPermissionOptions =
 | "Administrator"
 | "Moderator"
 | "RobloxModerator"
 | "RobloxGroupManager"
 | "PointsManager"
 | "PointsViewer"
 | "CreatePointLogs"
 | "EventScheduler"
 | "ScheduleManager";

export type CommandOps = {
	name: string;
	description: string;

    dmpermission?: boolean;
	module?: string;
    userApp?: boolean;
    devOnly?: boolean;

    permissions?: PermissionResolvable[];
    customPermissions?: customPermissionOptions[];

    subcommands?: SlashCommandSubcommandBuilder[] | SlashCommandSubcommandGroupBuilder[];
    options?: ValidOptions[];

	integration_types?: number[];
	contexts?: number[]

	globalCooldown?: number;
	guildCooldown?: number;
	userCooldown?: number;

	execute (interaction : ChatInputCommandInteraction): Promise<any>;
	autocomplete? (interaction : AutocompleteInteraction): Promise<{name : string, value : string}[] | {name : string, value : string} | any>;
}

export default class SlashCommand extends SlashCommandBuilder {
	permissions: PermissionResolvable[];
	customPermissions: customPermissionOptions[];
	subcommands?: SlashCommandSubcommandBuilder[] | SlashCommandSubcommandGroupBuilder[];
	devOnly?: boolean;
	userApp?: boolean;
	module: string;
	globalCooldown?: number;
	guildCooldown?: number;
	userCooldown?: number;

	integration_types = [0] as number[];
	contexts = [0, 1, 2] as number[];

	userCooldowns = new Map<string, number>();
	guildCooldowns = new Map<string, number>();
	lastUsedGlobal = 0;

	execute: (interaction : ChatInputCommandInteraction) => Promise<any>;
	autocomplete?: (interaction : AutocompleteInteraction) => Promise<{name : string, value : string}[] | {name : string, value : string} | any>;

	constructor (options: CommandOps) {
		super();
		this.setName(options.name);
		this.setDescription(options.description);

		this.permissions = options.permissions ?? [];
		this.customPermissions = options.customPermissions ?? [];

		this.module = options.module ?? "miscellaneous";
		this.devOnly = options.devOnly;
		this.globalCooldown = options.globalCooldown;
		this.guildCooldown = options.guildCooldown;
		this.userCooldown = options.userCooldown;

		this.autocomplete = options.autocomplete;
		this.execute = options.execute;

		if (options.options) {
			for (const option of options.options) {
				this.options.push(option)
			}
		}

		if (options.subcommands) {
			for (const subcommand of options.subcommands) {
				if (subcommand instanceof SlashCommandSubcommandGroupBuilder) {
					this.addSubcommandGroup(subcommand);
					continue
				}

				this.addSubcommand(subcommand)
			}
		}
		
		if (options.userApp) this.integration_types.push(1);
		this.setDMPermission(options.dmpermission || false);
	}

	async Check (interaction: ChatInputCommandInteraction) {
		if (this.devOnly && !client.Functions.isDev(interaction.user.id)) return false;
		if (!interaction.member) return false;
		if (this.permissions.length === 0 && this.customPermissions.length === 0) return true;
		if (interaction.guild) {
			if (typeof interaction.member.permissions === "string" || !interaction.member.permissions.has(this.permissions)) return false;
			
			if (this.customPermissions.length > 0) {
				if (!(interaction.member instanceof GuildMember)) return false;
				const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);
				const check = await guildDataProfile.customPermissionCheck(interaction.member, this.customPermissions);
				
				return check;
			}
		}

		return true
	}

	async Execute (interaction: ChatInputCommandInteraction) {
		if (client.Functions.isDev(interaction.user.id)) {
			await this.execute(interaction);
			return;
		}

		if (!(await this.Check(interaction))) {
			return interaction.reply({ content: "You do not have permission to run this command", ephemeral: true });
		}

		const currentTimestamp = new Date().getTime();

		if (this.userCooldown) {
			const user = this.userCooldowns.has(interaction.user.id);
			const currentCooldown = this.userCooldowns.get(interaction.user.id);

			if (user && currentCooldown) {
				const remainingCooldown = Math.ceil((this.userCooldown - (currentTimestamp - currentCooldown)) / 1000);

				if (currentTimestamp - currentCooldown < this.userCooldown) {
					return interaction.reply({ content: `You've used this command recently. Please retry again <t:${Math.round(currentTimestamp / 1000 + remainingCooldown)}:R>.`, ephemeral: true });
				}
			}
			this.userCooldowns.set(interaction.user.id, Date.now());
		}

		if (interaction.guild) {
			if (this.guildCooldown) {
				const guild = this.guildCooldowns.has(interaction.guild.id);
				const currentCooldown = this.guildCooldowns.get(interaction.guild.id);
	
				if (guild && currentCooldown) {
					const remainingCooldown = Math.ceil((this.guildCooldown - (currentTimestamp - currentCooldown)) / 1000);
	
					if (currentTimestamp - currentCooldown < this.guildCooldown) {
						return interaction.reply({ content: `This command is on a guild cooldown. Please retry again <t:${Math.round(currentTimestamp / 1000 + remainingCooldown)}:R>.`, ephemeral: true });
					}
				}
				this.guildCooldowns.set(interaction.guild.id, Date.now());
			}
		}

		if (this.globalCooldown) {
			if (currentTimestamp - this.lastUsedGlobal < this.globalCooldown) {
				const remainingCooldown = Math.ceil((this.globalCooldown - (currentTimestamp - this.lastUsedGlobal)) / 1000);
				return interaction.reply({ content: `This command is on a global cooldown. Please retry again <t:${Math.round(currentTimestamp / 1000 + remainingCooldown)}:R>`, ephemeral: true });
			}
			this.lastUsedGlobal = Date.now();
		}

		return await this.execute(interaction);
	}
}