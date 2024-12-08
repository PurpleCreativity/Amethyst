import {
    ApplicationIntegrationType,
    type AutocompleteInteraction,
    type ChatInputCommandInteraction,
    GuildMember,
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
import type { ValidPermissions } from "../../types/shared.js";
import type GuildProfile from "../database/GuildProfile.js";

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

/**
 * Represents an entry used in autocomplete responses.
 */
export type AutocompleteEntry = {
    /**
     * The display name shown to the user during autocomplete.
     */
    name: string;

    /**
     * The value associated with the entry, used when the user selects the option.
     * Can be either a string or a number.
     */
    value: string | number;
};

/**
 * Options for defining a slash command in Discord.
 */
export type SlashCommandOptions = {
    /**
     * The name of the command, used when invoking it in Discord.
     */
    name: string;

    /**
     * Localized names for the command, supporting internationalization.
     * @see {@link https://discord.js.org/#/docs/discord.js/main/typedef/LocalizationMap LocalizationMap}
     */
    name_localizations?: LocalizationMap;

    /**
     * The command's description, explaining its purpose.
     */
    description: string;

    /**
     * Localized descriptions for the command, allowing internationalization.
     * @see {@link https://discord.js.org/#/docs/discord.js/main/typedef/LocalizationMap LocalizationMap}
     */
    description_localizations?: LocalizationMap;

    /**
     * Whether the command is marked as NSFW (Not Safe for Work).
     * Default: `false`
     */
    nsfw?: boolean;

    /**
     * The module the command belongs to, used for organization.
     */
    module?: CommandModule;

    /**
     * A list of guild IDs where the command is enabled. If not provided, the command is enabled globally.
     */
    selected_guilds?: string[];

    /**
     * Whether the command's responses should be ephemeral (visible only to the user).
     * Default: `false`
     */
    ephemeral?: boolean;

    /**
     * Whether the command can be installed by regular users (not just guild admins).
     * Default: `false`
     */
    user_installable?: boolean;

    /**
     * Required Discord permissions for using the command.
     * @see {@link https://discord.js.org/#/docs/discord.js/main/typedef/PermissionResolvable PermissionResolvable}
     */
    discord_permissions?: PermissionResolvable[];

    /**
     * Custom application-specific permissions required to use the command.
     */
    permissions?: ValidPermissions[];

    /**
     * Whether the command is restricted to developers only.
     * Default: `false`
     */
    developer_only?: boolean;

    /**
     * The list of command options, including arguments and flags.
     * @see {@link https://discord.js.org/#/docs/discord.js/main/class/SlashCommandBuilder SlashCommandBuilder}
     */
    options?: ValidSlashCommandOptions[];

    /**
     * A list of subcommands or subcommand groups for the command.
     * @see {@link https://discord.js.org/#/docs/discord.js/main/class/SlashCommandSubcommandBuilder SlashCommandSubcommandBuilder}
     * @see {@link https://discord.js.org/#/docs/discord.js/main/class/SlashCommandSubcommandGroupBuilder SlashCommandSubcommandGroupBuilder}
     */
    subcommands?: SlashCommandSubcommandBuilder[] | SlashCommandSubcommandGroupBuilder[];

    /**
     * The function executed when the command is triggered.
     * @param interaction The command interaction instance.
     * @param guildProfile The profile of the guild, if applicable.
     * @returns A promise resolving to an unknown value.
     */
    function: (interaction: ChatInputCommandInteraction, guildProfile?: GuildProfile) => Promise<unknown>;

    /**
     * The function executed during autocomplete requests.
     * @param interaction The autocomplete interaction instance.
     * @param guildProfile The profile of the guild, if applicable.
     * @returns A list of autocomplete entries or a promise resolving to such a list.
     */
    autocomplete?: (
        interaction: AutocompleteInteraction,
        guildProfile?: GuildProfile,
    ) => AutocompleteEntry[] | Promise<AutocompleteEntry[]> | [];
};

/**
 * Represents a custom slash command extending Discord.js's `SlashCommandBuilder`.
 *
 * @see {@link https://discord.js.org/#/docs/discord.js/main/class/SlashCommandBuilder SlashCommandBuilder}
 */
export default class SlashCommand extends SlashCommandBuilder {
    /**
     * The module this command belongs to.
     *
     * @type {CommandModule | undefined}
     */
    readonly module: CommandModule | undefined;

    /**
     * List of specific guild IDs where this command is enabled.
     *
     * @type {string[]}
     */
    readonly selected_guilds: string[];

    /**
     * Indicates if responses from this command are ephemeral (private).
     *
     * @type {boolean}
     */
    readonly ephemeral: boolean;

    /**
     * Required Discord permissions for executing the command.
     *
     * @type {PermissionResolvable[]}
     * @see {@link https://discord.js.org/#/docs/discord.js/main/typedef/PermissionResolvable PermissionResolvable}
     */
    readonly discord_permissions: PermissionResolvable[];

    /**
     * Custom application-specific permissions required for the command.
     *
     * @type {ValidPermissions[]}
     */
    readonly permissions: ValidPermissions[];

    /**
     * Indicates if the command is only available to developers.
     *
     * @type {boolean}
     */
    readonly developer_only: boolean;

    /**
     * The function executed when the command is invoked.
     *
     * @private
     * @type {(interaction: ChatInputCommandInteraction, guildProfile?: GuildProfile) => unknown | Promise<unknown>}
     * @see {@link https://discord.js.org/#/docs/discord.js/main/class/ChatInputCommandInteraction ChatInputCommandInteraction}
     */
    private function: (
        interaction: ChatInputCommandInteraction,
        guildProfile?: GuildProfile,
    ) => unknown | Promise<unknown>;

    /**
     * Optional function for handling autocomplete interactions.
     *
     * @type {(interaction: AutocompleteInteraction, guildProfile?: GuildProfile) => AutocompleteEntry[] | Promise<AutocompleteEntry[]> | []}
     * @see {@link https://discord.js.org/#/docs/discord.js/main/class/AutocompleteInteraction AutocompleteInteraction}
     */
    autocomplete?: (
        interaction: AutocompleteInteraction,
        guildProfile?: GuildProfile,
    ) => AutocompleteEntry[] | Promise<AutocompleteEntry[]> | [];

    /**
     * Indicates if the command is globally disabled.
     *
     * @type {boolean}
     */
    disabled = false;

    /**
     * Creates a new `SlashCommand` instance with the provided options.
     *
     * @param {SlashCommandOptions} options - Configuration options for the command.
     */
    constructor(options: SlashCommandOptions) {
        super();

        this.setName(options.name);
        if (options.name_localizations) this.setNameLocalizations(options.name_localizations);

        this.setDescription(options.description);
        if (options.description_localizations) this.setDescriptionLocalizations(options.description_localizations);

        this.setNSFW(options.nsfw || false);

        this.module = options.module;
        this.selected_guilds = options.selected_guilds || [];
        this.ephemeral = options.ephemeral ?? false;

        this.discord_permissions = options.discord_permissions || [];
        this.permissions = options.permissions || [];
        this.developer_only = options.developer_only ?? false;

        if (options.options?.length) {
            for (const option of options.options) this.options.push(option);
        }

        if (options.subcommands?.length) {
            for (const subcommand of options.subcommands) {
                if (subcommand instanceof SlashCommandSubcommandBuilder) {
                    this.addSubcommand(subcommand);
                } else {
                    this.addSubcommandGroup(subcommand);
                }
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

    /**
     * Checks if the interaction meets the command's execution conditions.
     *
     * @private
     * @param {ChatInputCommandInteraction} interaction - The interaction invoking the command.
     * @param {GuildProfile | undefined} guildProfile - Optional guild profile for permissions validation.
     * @returns {Promise<CommandErrorName | undefined>} An error name if a condition fails, otherwise `undefined`.
     */
    private check = async (
        interaction: ChatInputCommandInteraction,
        guildProfile?: GuildProfile,
    ): Promise<CommandErrorName | undefined> => {
        if (client.Functions.isDev(interaction.user.id)) return undefined;

        if (this.disabled) return CommandErrorName.DISABLED_GLOBAL;
        if (this.developer_only) return CommandErrorName.DEVELOPER_ONLY;

        if (interaction.guild) {
            if (!interaction.member) return CommandErrorName.UNKNOWN;

            if (this.permissions.length > 0) {
                if (!guildProfile) return CommandErrorName.UNKNOWN;
                if (!(interaction.member instanceof GuildMember)) return CommandErrorName.UNKNOWN;

                const boolean = guildProfile.checkPermissions(interaction.member, this.permissions);
                if (!boolean) return CommandErrorName.MISSING_PERMISSIONS;
                return undefined;
            }

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

    /**
     * Executes the slash command after performing validation checks.
     *
     * @param {ChatInputCommandInteraction} interaction - The interaction invoking the command.
     * @param {GuildProfile | undefined} guildProfile - Optional guild profile for validation.
     * @returns {Promise<unknown>} The result of the command execution or an error response.
     */
    execute = async (interaction: ChatInputCommandInteraction, guildProfile?: GuildProfile): Promise<unknown> => {
        const error = await this.check(interaction, guildProfile);
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

        return await this.function(interaction, guildProfile);
    };
}
