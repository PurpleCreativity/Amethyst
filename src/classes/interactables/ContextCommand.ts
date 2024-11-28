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
import type { ValidPermissions } from "../../types/global.js";

export type BaseContextMenuCommandOptions = {
    name: string;
    name_localizations?: LocalizationMap;

    module?: CommandModule;
    selected_guilds?: string[];
    ephemeral?: boolean;
    user_installable?: boolean;

    discord_permissions?: PermissionResolvable[];
    permissions?: ValidPermissions[];
    developer_only?: boolean;
};

export type MessageContextMenuCommandOptions = BaseContextMenuCommandOptions & {
    function: (interaction: MessageContextMenuCommandInteraction) => Promise<unknown>;
};

export type UserContextMenuCommandOptions = BaseContextMenuCommandOptions & {
    function: (interaction: UserContextMenuCommandInteraction) => Promise<unknown>;
};

class BaseContextMenuCommand extends ContextMenuCommandBuilder {
    readonly module: CommandModule | undefined;
    readonly selected_guilds: string[];
    readonly ephemeral: boolean;

    readonly discord_permissions: PermissionResolvable[];
    readonly permissions: ValidPermissions[];
    readonly developer_only: boolean = false;

    disabled = false;

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
        this.module = options.module;
        this.selected_guilds = options.selected_guilds || [];

        this.discord_permissions = options.discord_permissions || [];
        this.permissions = options.permissions || [];
        this.developer_only = options.developer_only ?? false;
    }

    check = async (
        interaction: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
    ): Promise<CommandErrorName | undefined> => {
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
}

class MessageContextMenuCommand extends BaseContextMenuCommand {
    private function: (interaction: MessageContextMenuCommandInteraction) => Promise<unknown>;

    constructor(options: MessageContextMenuCommandOptions) {
        super(options);

        //this.setType(ApplicationCommandType.Message);
        this.setType(3);
        this.function = options.function;
    }

    execute = async (interaction: MessageContextMenuCommandInteraction): Promise<unknown> => {
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
class UserContextMenuCommand extends BaseContextMenuCommand {
    private function: (interaction: UserContextMenuCommandInteraction) => Promise<unknown>;

    constructor(options: UserContextMenuCommandOptions) {
        super(options);

        //this.setType(ApplicationCommandType.User);
        this.setType(2);
        this.function = options.function;
    }

    execute = async (interaction: UserContextMenuCommandInteraction): Promise<unknown> => {
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

export { BaseContextMenuCommand, MessageContextMenuCommand, UserContextMenuCommand };
