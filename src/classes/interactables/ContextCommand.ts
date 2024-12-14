import {
    ApplicationIntegrationType,
    ContextMenuCommandBuilder,
    GuildMember,
    InteractionContextType,
    type LocalizationMap,
    type MessageContextMenuCommandInteraction,
    type PermissionResolvable,
    type UserContextMenuCommandInteraction,
} from "discord.js";
import Icons from "../../../public/Icons.json" with { type: "json" };
import client from "../../main.js";
import { CommandErrorDescription, CommandErrorName, type CommandModule } from "../../types/Enums.js";
import type { ValidPermissions } from "../../types/shared.js";
import type GuildProfile from "../database/GuildProfile.js";

/**
 * Options for creating a base context menu command.
 */
export type BaseContextMenuCommandOptions = {
    /**
     * The name of the command displayed in Discord's context menu.
     */
    name: string;

    /**
     * Localized names for the command, allowing internationalization support.
     */
    name_localizations?: LocalizationMap;

    /**
     * The module this command belongs to, used for organization or grouping.
     */
    module?: CommandModule;

    /**
     * A list of guild IDs where the command is specifically enabled.
     * If not specified, the command is enabled globally.
     */
    selected_guilds?: string[];

    /**
     * Whether command responses should be ephemeral (only visible to the user).
     * Default: `false`
     */
    ephemeral?: boolean;

    /**
     * Whether the command can be installed by regular users, not just guild admins.
     * Default: `false`
     */
    user_installable?: boolean;

    /**
     * Required Discord permissions for executing the command.
     * @see {@link https://discord.js.org/docs/packages/discord.js/main/PermissionResolvable:TypeAlias PermissionResolvable}
     */
    discord_permissions?: PermissionResolvable[];

    /**
     * Custom application-specific permissions for the command.
     */
    permissions?: ValidPermissions[];

    /**
     * Whether the command is restricted to developers only.
     * Default: `false`
     */
    developer_only?: boolean;
};

export type MessageContextMenuCommandOptions = BaseContextMenuCommandOptions & {
    function: (interaction: MessageContextMenuCommandInteraction, guildProfile?: GuildProfile) => Promise<unknown>;
};

export type UserContextMenuCommandOptions = BaseContextMenuCommandOptions & {
    function: (interaction: UserContextMenuCommandInteraction, guildProfile?: GuildProfile) => Promise<unknown>;
};

/**
 * Base class for context menu commands.
 */
class BaseContextMenuCommand extends ContextMenuCommandBuilder {
    readonly module: CommandModule | undefined;
    readonly selected_guilds: string[];
    readonly ephemeral: boolean;
    readonly user_installable: boolean;

    readonly discord_permissions: PermissionResolvable[];
    readonly permissions: ValidPermissions[];
    readonly developer_only: boolean = false;

    disabled = false;

    /**
     * Initializes a new context menu command.
     * @param {BaseContextMenuCommandOptions} options - The command options.
     */
    constructor(options: BaseContextMenuCommandOptions) {
        super();

        this.setName(options.name);
        if (options.name_localizations) {
            this.setNameLocalizations(options.name_localizations);
        }

        this.setContexts(
            InteractionContextType.Guild,
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel,
        );

        if (options.user_installable) {
            this.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall);
        } else {
            this.setIntegrationTypes(ApplicationIntegrationType.GuildInstall);
        }

        this.ephemeral = options.ephemeral ?? false;
        this.user_installable = options.user_installable ?? false;
        this.module = options.module;
        this.selected_guilds = options.selected_guilds || [];
        this.discord_permissions = options.discord_permissions || [];
        this.permissions = options.permissions || [];
        this.developer_only = options.developer_only ?? false;
    }

    /**
     * Checks if the interaction meets all command requirements.
     * @param {MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction} interaction - The interaction.
     * @param {GuildProfile} [guildProfile] - The guild profile.
     * @returns {Promise<CommandErrorName | undefined>} Error name if validation fails.
     */
    async check(
        interaction: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
        guildProfile?: GuildProfile,
    ): Promise<CommandErrorName | undefined> {
        if (client.Functions.isDev(interaction.user.id)) return undefined;

        if (this.disabled) return CommandErrorName.DISABLED_GLOBAL;
        if (this.developer_only) return CommandErrorName.DEVELOPER_ONLY;

        if (interaction.guild) {
            if (!interaction.member) return CommandErrorName.UNKNOWN;

            if (this.permissions.length > 0) {
                if (!guildProfile || !(interaction.member instanceof GuildMember)) {
                    return CommandErrorName.UNKNOWN;
                }

                if (!guildProfile.checkPermissions(interaction.member, this.permissions)) {
                    return CommandErrorName.MISSING_PERMISSIONS;
                }
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
    }
}

/**
 * Command for handling message context menus.
 */
class MessageContextMenuCommand extends BaseContextMenuCommand {
    private function: (
        interaction: MessageContextMenuCommandInteraction,
        guildProfile?: GuildProfile,
    ) => Promise<unknown>;

    /**
     * Initializes a message context menu command.
     * @param {MessageContextMenuCommandOptions} options - Command options.
     */
    constructor(options: MessageContextMenuCommandOptions) {
        super(options);

        this.setType(3); // ApplicationCommandType.Message
        this.function = options.function;
    }

    /**
     * Executes the message context menu command.
     * @param {MessageContextMenuCommandInteraction} interaction - The interaction.
     * @param {GuildProfile} [guildProfile] - The guild profile.
     * @returns {Promise<unknown>} Command result.
     */
    async execute(interaction: MessageContextMenuCommandInteraction, guildProfile?: GuildProfile): Promise<unknown> {
        const error = await this.check(interaction, guildProfile);
        if (error) {
            return interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: `Error while executing command: \`${error}\``,
                        description: `\`\`\`${CommandErrorDescription[error]}\`\`\``,
                        thumbnail: Icons.moderation,
                    }),
                ],
            });
        }

        return this.function(interaction, guildProfile);
    }
}

/**
 * Command for handling user context menus.
 */
class UserContextMenuCommand extends BaseContextMenuCommand {
    private function: (interaction: UserContextMenuCommandInteraction, guildProfile?: GuildProfile) => Promise<unknown>;

    /**
     * Initializes a user context menu command.
     * @param {UserContextMenuCommandOptions} options - Command options.
     */
    constructor(options: UserContextMenuCommandOptions) {
        super(options);

        this.setType(2); // ApplicationCommandType.User
        this.function = options.function;
    }

    /**
     * Executes the user context menu command.
     * @param {UserContextMenuCommandInteraction} interaction - The interaction.
     * @param {GuildProfile} [guildProfile] - The guild profile.
     * @returns {Promise<unknown>} Command result.
     */
    async execute(interaction: UserContextMenuCommandInteraction, guildProfile?: GuildProfile): Promise<unknown> {
        const error = await this.check(interaction, guildProfile);
        if (error) {
            return interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: `Error while executing command: \`${error}\``,
                        description: `\`\`\`${CommandErrorDescription[error]}\`\`\``,
                        thumbnail: Icons.moderation,
                    }),
                ],
            });
        }

        return this.function(interaction, guildProfile);
    }
}

export { BaseContextMenuCommand, MessageContextMenuCommand, UserContextMenuCommand };
