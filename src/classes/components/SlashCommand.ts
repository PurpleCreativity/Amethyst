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
import client from "../../main.js";
import type { CommandModule, CommandPermission } from "../../types/core/Interactables.js";
import type GuildProfile from "../database/GuildProfile.js";

type ValidSlashCommandOption =
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
 * The function executed when the command is triggered.
 */
type SlashCommandFunction = (interaction: ChatInputCommandInteraction, guildProfile?: GuildProfile) => Promise<unknown>;

/**
 * The function executed during autocomplete requests.
 */
type AutocompleteFunction = (
    interaction: AutocompleteInteraction,
    guildProfile?: GuildProfile,
) => AutocompleteEntry[] | Promise<AutocompleteEntry[]> | [];

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
    module: CommandModule;

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
     * Custom application-specific permissions required to use the command.
     */
    permissions?: CommandPermission[];

    /**
     * Whether the command is restricted to developers only.
     * Default: `false`
     */
    devOnly?: boolean;

    /**
     * The list of command options, including arguments and flags.
     */
    options?: ValidSlashCommandOption[];

    /**
     * A list of subcommands or subcommand groups for the command.
     */
    subcommands?: SlashCommandSubcommandBuilder[] | SlashCommandSubcommandGroupBuilder[];

    /**
     * The function executed when the command is triggered.
     * @param interaction The command interaction instance.
     * @param guildProfile The profile of the guild, if applicable.
     * @returns A promise resolving to an unknown value.
     */
    function: SlashCommandFunction;

    /**
     * The function executed during autocomplete requests.
     * @param interaction The autocomplete interaction instance.
     * @param guildProfile The profile of the guild, if applicable.
     * @returns A list of autocomplete entries or a promise resolving to such a list.
     */
    autocomplete?: AutocompleteFunction;
};

/**
 * Represents a custom slash command extending Discord.js's `SlashCommandBuilder`.
 */
export default class SlashCommand extends SlashCommandBuilder {
    readonly module: CommandModule;
    readonly ephemeral: boolean;
    readonly userApp: boolean;

    readonly permissions: CommandPermission[];
    readonly selectedGuilds: string[];
    readonly devOnly: boolean;
    readonly disabled: boolean;

    private function: SlashCommandFunction;
    readonly autocomplete?: AutocompleteFunction;

    constructor(options: SlashCommandOptions) {
        super();

        this.setName(options.name);
        if (options.nameLocalizations) this.setNameLocalizations(options.nameLocalizations);

        this.setDescription(options.description);
        if (options.description_localizations) this.setDescriptionLocalizations(options.description_localizations);

        this.setNSFW(options.nsfw ?? false);

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

        this.module = options.module;
        this.ephemeral = options.ephemeral ?? false;
        this.userApp = options.userApp ?? false;

        this.permissions = options.permissions ?? [];
        this.selectedGuilds = options.selectedGuilds ?? [];
        this.devOnly = options.devOnly ?? false;
        this.disabled = false;

        this.function = options.function;
        this.autocomplete = options.autocomplete;
    }

    private async check(
        interaction: ChatInputCommandInteraction,
        guildProfile?: GuildProfile,
    ): Promise<string | undefined> {
        if (client.Functions.isDev(interaction.user.id)) return undefined;

        if (this.disabled) return "This command has been globally disabled.";
        if (this.devOnly) return "This command is only avaible to developers.";

        if (interaction.guild) {
            if (!interaction.member || !(interaction.member instanceof GuildMember)) return "You're not real. (lmfao)";

            if (!guildProfile && this.permissions.length > 0)
                return "GuildProfile doesn't exist, and there are necessary permissions to check.\n\nPlease try again later.";
            if (!guildProfile?.checkPermissions(interaction.member, this.permissions))
                return "You don't have permissions to use this.";

            return undefined;
        }
    }

    public async execute(interaction: ChatInputCommandInteraction, guildProfile?: GuildProfile): Promise<void> {
        const errorMessage = await this.check(interaction, guildProfile);
        if (errorMessage) {
            await interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "Error while executing command",
                        description: `\`\`\`${errorMessage}\`\`\``,
                    }),
                ],
            });
            return;
        }

        await this.function(interaction, guildProfile);
    }
}
