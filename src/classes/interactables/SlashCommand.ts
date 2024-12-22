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
import Images from "../../../public/Images.json" with { type: "json" };
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
     */
    nameLocalizations?: LocalizationMap;

    /**
     * The command's description, explaining its purpose.
     */
    description: string;

    /**
     * Localized descriptions for the command, allowing internationalization.
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
    selectedGuilds?: string[];

    /**
     * Whether the command's responses should be ephemeral (visible only to the user).
     * Default: `false`
     */
    ephemeral?: boolean;

    /**
     * Whether the command can be installed by regular users (not just guild admins).
     * Default: `false`
     */
    userApp?: boolean;

    /**
     * Required Discord permissions for using the command.
     * @see {@link https://discord.js.org/docs/packages/discord.js/main/PermissionResolvable:TypeAlias PermissionResolvable}
     */
    discordPermissions?: PermissionResolvable[];

    /**
     * Custom application-specific permissions required to use the command.
     */
    permissions?: ValidPermissions[];

    /**
     * Whether the command is restricted to developers only.
     * Default: `false`
     */
    devOnly?: boolean;

    /**
     * The list of command options, including arguments and flags.
     * @see {@link https://discord.js.org/#/docs/discord.js/main/SlashCommandBuilder:Class SlashCommandBuilder}
     */
    options?: ValidSlashCommandOptions[];

    /**
     * A list of subcommands or subcommand groups for the command.
     * @see {@link https://discord.js.org/#/docs/discord.js/main/SlashCommandSubcommandBuilder:Class SlashCommandSubcommandBuilder}
     * @see {@link https://discord.js.org/#/docs/discord.js/main/SlashCommandSubcommandGroupBuilder:Class SlashCommandSubcommandGroupBuilder}
     */
    subcommands?: SlashCommandSubcommandBuilder[] | SlashCommandSubcommandGroupBuilder[];

    /**
     * The function executed when the command is triggered.
     * @param interaction The command interaction instance.
     * @param guildProfile The profile of the guild, if applicable.
     * @returns A promise resolving to an unknown value.
     */
    function(interaction: ChatInputCommandInteraction, guildProfile?: GuildProfile): Promise<unknown>;

    /**
     * The function executed during autocomplete requests.
     * @param interaction The autocomplete interaction instance.
     * @param guildProfile The profile of the guild, if applicable.
     * @returns A list of autocomplete entries or a promise resolving to such a list.
     */
    autocomplete?(
        interaction: AutocompleteInteraction,
        guildProfile?: GuildProfile,
    ): AutocompleteEntry[] | Promise<AutocompleteEntry[]> | [];
};

/**
 * Represents a custom slash command extending Discord.js's `SlashCommandBuilder`.
 *
 * @see {@link https://discord.js.org/#/docs/discord.js/main/SlashCommandBuilder:Class SlashCommandBuilder}
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
    readonly selectedGuilds: string[];

    /**
     * Indicates if responses from this command are ephemeral (private).
     *
     * @type {boolean}
     */
    readonly ephemeral: boolean;

    readonly userApp: boolean;

    /**
     * Required Discord permissions for executing the command.
     *
     * @type {PermissionResolvable[]}
     * @see {@link https://discord.js.org/docs/packages/discord.js/main/PermissionResolvable:TypeAlias PermissionResolvable}
     */
    readonly discordPermissions: PermissionResolvable[];

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
    readonly devOnly: boolean;

    /**
     * The function executed when the command is invoked.
     *
     * @private
     * @see {@link https://discord.js.org/docs/packages/discord.js/main/ChatInputCommandInteraction:Class ChatInputCommandInteraction}
     */
    function: (interaction: ChatInputCommandInteraction, guildProfile?: GuildProfile) => Promise<unknown>;

    /**
     * Optional function for handling autocomplete interactions.
     *
     * @see {@link https://discord.js.org/docs/packages/discord.js/main/AutocompleteInteraction:Class AutocompleteInteraction}
     */
    autocomplete?: (
        interaction: AutocompleteInteraction,
        guildProfile?: GuildProfile,
    ) => AutocompleteEntry[] | Promise<AutocompleteEntry[]>;

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
        if (options.nameLocalizations) this.setNameLocalizations(options.nameLocalizations);

        this.setDescription(options.description);
        if (options.description_localizations) this.setDescriptionLocalizations(options.description_localizations);

        this.setNSFW(options.nsfw || false);

        this.module = options.module;
        this.selectedGuilds = options.selectedGuilds || [];
        this.ephemeral = options.ephemeral ?? false;
        this.userApp = options.userApp ?? false;

        this.discordPermissions = options.discordPermissions || [];
        this.permissions = options.permissions || [];
        this.devOnly = options.devOnly ?? false;

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

        if (options.userApp && !options.selectedGuilds) {
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
    private async check(
        interaction: ChatInputCommandInteraction,
        guildProfile?: GuildProfile,
    ): Promise<CommandErrorName | undefined> {
        if (client.Functions.isDev(interaction.user.id)) return undefined;

        if (this.disabled) return CommandErrorName.DISABLED_GLOBAL;
        if (this.devOnly) return CommandErrorName.DEVELOPER_ONLY;

        if (interaction.guild) {
            if (!interaction.member) return CommandErrorName.UNKNOWN;

            if (this.permissions.length > 0) {
                if (!guildProfile) return CommandErrorName.UNKNOWN;
                if (!(interaction.member instanceof GuildMember)) return CommandErrorName.UNKNOWN;

                const boolean = guildProfile.checkPermissions(interaction.member, this.permissions);
                if (!boolean) return CommandErrorName.MISSING_PERMISSIONS;
                return undefined;
            }

            if (this.discordPermissions.length > 0) {
                if (typeof interaction.member.permissions === "string") {
                    return CommandErrorName.UNKNOWN;
                }
                if (!interaction.member.permissions.has("Administrator")) {
                    for (const permission of this.discordPermissions) {
                        if (!interaction.member.permissions.has(permission)) {
                            return CommandErrorName.MISSING_DISCORD_PERMISSIONS;
                        }
                    }
                }
            }
        }

        return undefined;
    }

    /**
     * Executes the slash command after performing validation checks.
     *
     * @param {ChatInputCommandInteraction} interaction - The interaction invoking the command.
     * @param {GuildProfile | undefined} guildProfile - Optional guild profile for validation.
     * @returns {Promise<unknown>} The result of the command execution or an error response.
     */
    async execute(interaction: ChatInputCommandInteraction, guildProfile?: GuildProfile): Promise<unknown> {
        const error = await this.check(interaction, guildProfile);
        if (error) {
            return await interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: `Error while executing command: \`${error}\``,
                        description: `\`\`\`${CommandErrorDescription[error]}\`\`\``,
                        thumbnail: Images.moderation,
                    }),
                ],
            });
        }

        return await this.function(interaction, guildProfile);
    }
}
