import {
    ApplicationIntegrationType,
    type AutocompleteInteraction,
    type ChatInputCommandInteraction,
    InteractionContextType,
    type LocalizationMap,
    type PermissionResolvable,
    type SlashCommandAttachmentOption,
    type SlashCommandBooleanOption,
    SlashCommandBuilder,
    type SlashCommandChannelOption,
    type SlashCommandIntegerOption,
    type SlashCommandMentionableOption,
    type SlashCommandNumberOption,
    type SlashCommandRoleOption,
    type SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
    type SlashCommandSubcommandGroupBuilder,
    type SlashCommandUserOption,
} from "discord.js";
import Icons from "../../../public/Icons.json" with { type: "json" };
import client from "../../main.js";
import { CommandErrorDescription, CommandErrorName, type CommandModule } from "../../types/Enums.js";
import type { ValidPermissions } from "../../types/global.js";

export type ValidSlashCommandOptions =
    | SlashCommandStringOption
    | SlashCommandNumberOption
    | SlashCommandIntegerOption
    | SlashCommandBooleanOption
    | SlashCommandRoleOption
    | SlashCommandUserOption
    | SlashCommandChannelOption
    | SlashCommandMentionableOption
    | SlashCommandAttachmentOption;

export type AutocompleteEntry = {
    name: string;
    value: string | number;
};

export type SlashCommandOptions = {
    name: string;
    name_localizations?: LocalizationMap;

    description: string;
    description_localizations?: LocalizationMap;

    nsfw?: boolean;
    module?: CommandModule;
    selected_guilds?: string[];
    ephemeral?: boolean;
    user_installable?: boolean;

    discord_permissions?: PermissionResolvable[];
    permissions?: ValidPermissions[];
    developer_only?: boolean;

    options?: ValidSlashCommandOptions[];
    subcommands?: SlashCommandSubcommandBuilder[] | SlashCommandSubcommandGroupBuilder[];

    function: (interaction: ChatInputCommandInteraction) => Promise<unknown>;
    autocomplete?: (interaction: AutocompleteInteraction) => AutocompleteEntry[] | Promise<AutocompleteEntry[]> | [];
};

export default class SlashCommand extends SlashCommandBuilder {
    readonly module: CommandModule | undefined;
    readonly selected_guilds: string[];
    readonly ephemeral: boolean;

    readonly discord_permissions: PermissionResolvable[];
    readonly permissions: ValidPermissions[];
    readonly developer_only: boolean;

    private function: (interaction: ChatInputCommandInteraction) => unknown | Promise<unknown>;
    autocomplete?: (interaction: AutocompleteInteraction) => AutocompleteEntry[] | Promise<AutocompleteEntry[]> | [];

    disabled = false;

    constructor(options: SlashCommandOptions) {
        super();

        this.setName(options.name);
        if (options.name_localizations) {
            this.setNameLocalizations(options.name_localizations);
        }

        this.setDescription(options.description);
        if (options.description_localizations) {
            this.setDescriptionLocalizations(options.description_localizations);
        }

        this.setNSFW(options.nsfw || false);

        this.module = options.module;
        this.selected_guilds = options.selected_guilds || [];
        this.ephemeral = options.ephemeral ?? false;

        this.discord_permissions = options.discord_permissions || [];
        this.permissions = options.permissions || [];
        this.developer_only = options.developer_only ?? false;

        if (options.options && options.options.length > 0) {
            for (const option of options.options) {
                this.options.push(option);
            }
        }

        if (options.subcommands && options.subcommands.length > 0) {
            for (const subcommand of options.subcommands) {
                if (subcommand instanceof SlashCommandSubcommandBuilder) {
                    this.addSubcommand(subcommand);
                    continue;
                }

                this.addSubcommandGroup(subcommand);
            }
        }

        this.function = options.function;
        this.autocomplete = options.autocomplete;

        this.setContexts(
            InteractionContextType.Guild,
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel,
        );

        if (options.user_installable && !options.selected_guilds) {
            this.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall);
        } else {
            this.setIntegrationTypes(ApplicationIntegrationType.GuildInstall);
        }
    }

    private check = async (interaction: ChatInputCommandInteraction): Promise<CommandErrorName | undefined> => {
        if (client.Functions.isDev(interaction.user.id)) return undefined;

        if (this.disabled) return CommandErrorName.DISABLED_GLOBAL;
        if (this.developer_only) return CommandErrorName.DEVELOPER_ONLY;

        if (interaction.guild) {
            if (!interaction.member) return CommandErrorName.UNKNOWN;

            /*
            if (this.permissions.length > 0) {
                if (!guildProfile) return CommandError.UNKNOWN;
                if (!(interaction.member instanceof GuildMember)) return CommandError.UNKNOWN;

                const boolean = guildProfile.checkPermissions(interaction.member, this.permissions);
                if (!boolean) return CommandError.MISSING_PERMISSIONS;
                return undefined;
            }
            */

            if (this.discord_permissions.length > 0) {
                if (typeof interaction.member.permissions === "string") {
                    return CommandErrorName.UNKNOWN;
                }
                if (!interaction.member.permissions.has("Administrator")) {
                    for (const permission of this.discord_permissions) {
                        if (!interaction.member.permissions.has(permission)) {
                            return CommandErrorName.MISSING_DISCORD_PERMISSIONS;
                        }
                    }
                }
            }
        }

        return undefined;
    };

    execute = async (interaction: ChatInputCommandInteraction): Promise<unknown> => {
        await interaction.deferReply({ ephemeral: this.ephemeral });

        const error = await this.check(interaction);
        if (error) {
            return await interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: `Error while executing command: \`${error}\``,
                        description: `\`\`\`${CommandErrorDescription[error]}\`\`\``,
                        thumbnail: Icons.moderation,
                    }),
                ],
            });
        }

        return await this.function(interaction);
    };
}