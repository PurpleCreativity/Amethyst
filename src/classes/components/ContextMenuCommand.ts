import {
    ApplicationCommandType,
    ApplicationIntegrationType,
    ContextMenuCommandBuilder,
    GuildMember,
    InteractionContextType,
    type LocalizationMap,
    type MessageContextMenuCommandInteraction,
    type UserContextMenuCommandInteraction,
} from "discord.js";
import client from "../../main.js";
import type { CommandModule, CommandPermission } from "../../types/core/Interactables.js";
import type GuildProfile from "../database/GuildProfile.js";

/**
 * Options for creating a base context menu command.
 */
type BaseContextMenuCommandOptions = {
    /**
     * The name of the command displayed in Discord's context menu.
     */
    name: string;

    /**
     * Localized names for the command, allowing internationalization support.
     */
    nameLocalizations?: LocalizationMap;

    /**
     * The module this command belongs to, used for organization or grouping.
     */
    module: CommandModule;

    /**
     * A list of guild IDs where the command is specifically enabled.
     * If not specified, the command is enabled globally.
     */
    selectedGuilds?: string[];

    /**
     * Whether command responses should be ephemeral (only visible to the user).
     * Default: `false`
     */
    ephemeral?: boolean;

    /**
     * Whether the command can be installed by regular users, not just guild admins.
     * Default: `false`
     */
    userApp?: boolean;

    /**
     * Custom application-specific permissions for the command.
     */
    permissions?: CommandPermission[];

    /**
     * Whether the command is restricted to developers only.
     * Default: `false`
     */
    devOnly?: boolean;
};

type MessageContextMenuCommandFunction = (
    interaction: MessageContextMenuCommandInteraction,
    guildProfile?: GuildProfile,
) => Promise<void>;
export type MessageContextMenuCommandOptions = BaseContextMenuCommandOptions & {
    function: MessageContextMenuCommandFunction;
};

type UserContextMenuCommandFunction = (
    interaction: UserContextMenuCommandInteraction,
    guildProfile?: GuildProfile,
) => Promise<void>;
export type UserContextMenuCommandOptions = BaseContextMenuCommandOptions & {
    function: UserContextMenuCommandFunction;
};

/**
 * Base class for context menu commands.
 */
class BaseContextMenuCommand extends ContextMenuCommandBuilder {
    public readonly module: CommandModule;
    public readonly ephemeral: boolean;
    public readonly userApp: boolean;

    public readonly permissions: CommandPermission[];
    public readonly selectedGuilds: string[];
    public readonly devOnly: boolean;
    public readonly disabled: boolean;

    constructor(options: BaseContextMenuCommandOptions) {
        super();

        this.setName(options.name);
        if (options.nameLocalizations) {
            this.setNameLocalizations(options.nameLocalizations);
        }

        this.setContexts(
            InteractionContextType.Guild,
            InteractionContextType.BotDM,
            InteractionContextType.PrivateChannel,
        );

        if (options.userApp) {
            this.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall);
        } else {
            this.setIntegrationTypes(ApplicationIntegrationType.GuildInstall);
        }

        this.module = options.module;
        this.ephemeral = options.ephemeral ?? false;
        this.userApp = options.userApp ?? false;

        this.permissions = options.permissions ?? [];
        this.selectedGuilds = options.selectedGuilds ?? [];
        this.devOnly = options.devOnly ?? false;
        this.disabled = false;
    }

    public async check(
        interaction: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
        guildProfile?: GuildProfile,
    ): Promise<undefined | string> {
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
}

export class MessageContextMenuCommand extends BaseContextMenuCommand {
    private function: MessageContextMenuCommandFunction;

    constructor(options: MessageContextMenuCommandOptions) {
        super(options);

        this.setType(ApplicationCommandType.Message);
        this.function = options.function;
    }

    public async execute(
        interaction: MessageContextMenuCommandInteraction,
        guildProfile?: GuildProfile,
    ): Promise<void> {
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

export class UserContextMenuCommand extends BaseContextMenuCommand {
    private function: UserContextMenuCommandFunction;

    constructor(options: UserContextMenuCommandOptions) {
        super(options);

        this.setType(ApplicationCommandType.User);
        this.function = options.function;
    }

    public async execute(interaction: UserContextMenuCommandInteraction, guildProfile?: GuildProfile): Promise<void> {
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
