import {
    ApplicationIntegrationType,
    ContextMenuCommandBuilder,
    InteractionContextType,
    type LocalizationMap,
    type MessageContextMenuCommandInteraction,
    type PermissionResolvable,
    type UserContextMenuCommandInteraction,
} from "discord.js";
import Icons from "../../public/Icons.json" with { type: "json" };
import { CommandError, CommandErrorDescription, type CommandModule } from "../types/Enums.js";
import type { ValidPermissions } from "../types/global.d.js";
import type Client from "./Client.js";

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
    function: (client: Client, interaction: MessageContextMenuCommandInteraction) => Promise<unknown>;
};

export type UserContextMenuCommandOptions = BaseContextMenuCommandOptions & {
    function: (client: Client, interaction: UserContextMenuCommandInteraction) => Promise<unknown>;
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

        this.ephemeral = options.ephemeral || false;
        this.module = options.module;
        this.selected_guilds = options.selected_guilds || [];

        this.discord_permissions = options.discord_permissions || [];
        this.permissions = options.permissions || [];
        this.developer_only = options.developer_only || false;
    }

    check = async (
        client: Client,
        interaction: MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
    ): Promise<CommandError | undefined> => {
        if (client.Functions.isDev(interaction.user.id)) return undefined;

        if (this.disabled) return CommandError.DISABLED_GLOBAL;
        if (this.developer_only) return CommandError.DEVELOPER_ONLY;

        if (interaction.guild) {
            if (!interaction.member) return CommandError.UNKNOWN;

            //! Amethyst Custom Permission here later

            if (this.discord_permissions.length > 0) {
                if (typeof interaction.member.permissions === "string") {
                    return CommandError.UNKNOWN;
                }
                if (!interaction.member.permissions.has("Administrator")) {
                    for (const permission of this.discord_permissions) {
                        if (!interaction.member.permissions.has(permission)) {
                            return CommandError.MISSING_DISCORD_PERMISSIONS;
                        }
                    }
                }
            }
        }

        return undefined;
    };
}

class MessageContextMenuCommand extends BaseContextMenuCommand {
    private function: (client: Client, interaction: MessageContextMenuCommandInteraction) => Promise<unknown>;

    constructor(options: MessageContextMenuCommandOptions) {
        super(options);

        //this.setType(ApplicationCommandType.Message);
        this.setType(3);
        this.function = options.function;
    }

    execute = async (client: Client, interaction: MessageContextMenuCommandInteraction): Promise<unknown> => {
        await interaction.deferReply({ ephemeral: this.ephemeral });

        const error = await this.check(client, interaction);
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

        return await this.function(client, interaction);
    };
}
class UserContextMenuCommand extends BaseContextMenuCommand {
    private function: (client: Client, interaction: UserContextMenuCommandInteraction) => Promise<unknown>;

    constructor(options: UserContextMenuCommandOptions) {
        super(options);

        //this.setType(ApplicationCommandType.User);
        this.setType(2);
        this.function = options.function;
    }

    execute = async (client: Client, interaction: UserContextMenuCommandInteraction): Promise<unknown> => {
        await interaction.deferReply({ ephemeral: this.ephemeral });

        const error = await this.check(client, interaction);
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

        return await this.function(client, interaction);
    };
}

export { BaseContextMenuCommand, MessageContextMenuCommand, UserContextMenuCommand };
