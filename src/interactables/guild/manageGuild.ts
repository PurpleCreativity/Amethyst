import {
    ButtonStyle,
    type Guild,
    SlashCommandSubcommandBuilder,
    SlashCommandSubcommandGroupBuilder,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import Button from "../../classes/components/Button.js";
import ButtonEmbed from "../../classes/components/ButtonEmbed.js";
import Modal from "../../classes/components/Modal.js";
import SlashCommand from "../../classes/components/SlashCommand.js";
import client from "../../main.js";
import { CommandModule, CommandPermission } from "../../types/core/Interactables.js";

const permissionCommandChoices = Object.entries(CommandPermission)
    .filter(([key]) => Number.isNaN(Number(key)))
    .map(([key, value]) => ({
        name: key.replace(/([A-Z])/g, " $1").trim(),
        value: value.toString(),
    }));

export default new SlashCommand({
    name: "manageguild",
    description: "Manage the guild settings",
    module: CommandModule.Guild,

    permissions: [CommandPermission.Administrator],
    subcommands: [
        new SlashCommandSubcommandGroupBuilder()
            .setName("channels")
            .setDescription("Manage your guild channels")
            .addSubcommand(new SlashCommandSubcommandBuilder().setName("list").setDescription("List all channels"))
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("set")
                    .setDescription("Set a channel")
                    .addStringOption((option) =>
                        option.setName("type").setDescription("The channel type").setRequired(true),
                    )
                    .addChannelOption((option) =>
                        option.setName("channel").setDescription("The value to set").setRequired(true),
                    ),
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("remove")
                    .setDescription("Remove a channel")
                    .addStringOption((option) =>
                        option.setName("type").setDescription("The channel type").setRequired(true),
                    ),
            ),

        new SlashCommandSubcommandGroupBuilder()
            .setName("permissions")
            .setDescription("Manage your guild permissions")
            .addSubcommand(new SlashCommandSubcommandBuilder().setName("list").setDescription("List all permissions"))
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("set")
                    .setDescription("Set Users or Roles to a permission")
                    .addStringOption((option) =>
                        option
                            .setName("permission")
                            .setDescription("The permission to set")
                            .setChoices(permissionCommandChoices)
                            .setRequired(true),
                    ),
            ),
    ],

    function: async (interaction, guildProfile) => {
        if (!guildProfile || !interaction.guild) throw new Error("Unknown error");

        const subcommandGroup = interaction.options.getSubcommandGroup(true);
        const subcommand = interaction.options.getSubcommand(true);
        switch (subcommandGroup) {
            case "channels": {
                switch (subcommand) {
                    case "list":
                        {
                            const channelList = Object.entries(guildProfile.channels)
                                .map(([key, value]) => `\`${key}\`: <#${value}>`)
                                .join("\n");

                            await interaction.editReply({
                                embeds: [
                                    client.Functions.makeInfoEmbed({
                                        title: "Channel list",
                                        description: channelList || "No channels set",
                                    }),
                                ],
                            });
                        }
                        break;

                    case "set":
                        {
                            const type = interaction.options.getString("type", true);
                            const channel = interaction.options.getChannel("channel", true);
                            if (!(channel instanceof TextChannel)) {
                                await interaction.editReply({
                                    embeds: [
                                        client.Functions.makeErrorEmbed({
                                            title: "Invalid channel",
                                            description: "Please provide a valid `textchannel`",
                                        }),
                                    ],
                                });
                                return;
                            }

                            guildProfile.setChannel(type, channel.id);
                            await guildProfile.save();

                            await interaction.editReply({
                                embeds: [
                                    client.Functions.makeSuccessEmbed({
                                        title: "Channel set",
                                        description: `Set \`${type}\` to <#${channel.id}>`,
                                    }),
                                ],
                            });
                        }
                        break;

                    case "remove":
                        {
                            const type = interaction.options.getString("type", true);

                            guildProfile.setChannel(type, undefined);
                            await guildProfile.save();

                            await interaction.editReply({
                                embeds: [
                                    client.Functions.makeSuccessEmbed({
                                        title: "Channel removed",
                                        description: `Removed \`${type}\``,
                                    }),
                                ],
                            });
                        }
                        break;
                }
                break;
            }

            case "permissions": {
                switch (subcommand) {
                    case "list":
                        {
                            const permissionList = Object.entries(guildProfile.permissions).map(([key, value]) => {
                                const permissionName =
                                    permissionCommandChoices.find((choice) => choice.value === key)?.name || key;
                                const users = value.users.map((id) => `<@${id}>`).join(", ");
                                const roles = value.roles.map((id) => `<@&${id}>`).join(", ");
                                return {
                                    name: permissionName,
                                    value: `Users: ${users || "`None`"}\nRoles: ${roles || "`None`"}`,
                                };
                            });

                            await interaction.editReply({
                                embeds: [
                                    client.Functions.makeInfoEmbed({
                                        title: "Permission list",
                                        fields: permissionList.length
                                            ? permissionList
                                            : [{ name: "No permissions set", value: "\u200B" }],
                                    }),
                                ],
                            });
                        }
                        break;

                    case "set":
                        {
                            const permission = interaction.options.getString("permission", true);
                            const permissionData = guildProfile.getPermission(
                                Number.parseInt(permission) as CommandPermission,
                            );

                            if (!permissionData) {
                                await interaction.editReply({
                                    embeds: [
                                        client.Functions.makeErrorEmbed({
                                            title: "Invalid permission",
                                            description: "Please provide a valid permission type",
                                        }),
                                    ],
                                });
                                return;
                            }
                            const permissionName =
                                permissionCommandChoices.find((choice) => choice.value === permission)?.name ||
                                permission;
                            const buttonEmbed = new ButtonEmbed(
                                client.Functions.makeInfoEmbed({ title: permissionName }),
                            );
                            const updateEmbed = () => {
                                const users = permissionData.users.map((id) => `<@${id}>`).join(", ");
                                const roles = permissionData.roles.map((id) => `<@&${id}>`).join(", ");

                                buttonEmbed.embed.setField("Users", users || "`None`", false);
                                buttonEmbed.embed.setField("Roles", roles || "`None`", false);
                            };

                            updateEmbed();

                            buttonEmbed.addButton(
                                new Button({
                                    label: "Add Users",
                                    style: ButtonStyle.Success,
                                    allowedUsers: [interaction.user.id],
                                }).onPressed(async (buttonInteraction) => {
                                    const modal = new Modal({
                                        title: "Add Users",
                                        inputs: [
                                            new TextInputBuilder()
                                                .setCustomId("list")
                                                .setLabel("List")
                                                .setStyle(TextInputStyle.Paragraph)
                                                .setPlaceholder("purple_creativity,purple,762329291169857537,[...]")
                                                .setRequired(true),
                                        ],
                                    });

                                    const response = await modal.prompt(buttonInteraction);
                                    await response.deferUpdate();

                                    const users = response.fields.getTextInputValue("list").split(",");
                                    const actualUsers = [];
                                    for (const searcher of users) {
                                        const actualUser = await client.Functions.fetchUser(
                                            searcher.trim(),
                                            interaction.guild as Guild,
                                        );
                                        if (actualUser) actualUsers.push(actualUser.id);
                                    }

                                    guildProfile.addUsersToPermission(
                                        Number.parseInt(permission) as CommandPermission,
                                        actualUsers,
                                    );

                                    updateEmbed();
                                    await interaction.editReply(buttonEmbed.getMessageData());
                                }),
                            );

                            buttonEmbed.addButton(
                                new Button({
                                    label: "Remove Users",
                                    style: ButtonStyle.Primary,
                                    allowedUsers: [interaction.user.id],
                                }).onPressed(async (buttonInteraction) => {
                                    const modal = new Modal({
                                        title: "Remove Users",
                                        inputs: [
                                            new TextInputBuilder()
                                                .setCustomId("list")
                                                .setLabel("List")
                                                .setStyle(TextInputStyle.Paragraph)
                                                .setPlaceholder("purple_creativity,purple,762329291169857537,[...]")
                                                .setRequired(true),
                                        ],
                                    });

                                    const response = await modal.prompt(buttonInteraction);
                                    await response.deferUpdate();

                                    const users = response.fields.getTextInputValue("list").split(",");
                                    const actualUsers = [];
                                    for (const searcher of users) {
                                        const actualUser = await client.Functions.fetchUser(
                                            searcher.trim(),
                                            interaction.guild as Guild,
                                        );
                                        if (actualUser) actualUsers.push(actualUser.id);
                                    }

                                    guildProfile.removeUsersFromPermission(
                                        Number.parseInt(permission) as CommandPermission,
                                        actualUsers,
                                    );

                                    updateEmbed();
                                    await interaction.editReply(buttonEmbed.getMessageData());
                                }),
                            );

                            buttonEmbed.addButton(
                                new Button({
                                    label: "Clear Users",
                                    style: ButtonStyle.Danger,
                                    allowedUsers: [interaction.user.id],
                                }).onPressed(async (buttonInteraction) => {
                                    await buttonInteraction.deferUpdate();
                                    permissionData.users = [];

                                    updateEmbed();
                                    await interaction.editReply(buttonEmbed.getMessageData());
                                }),
                            );

                            buttonEmbed.nextRow();

                            buttonEmbed.addButton(
                                new Button({
                                    label: "Add Roles",
                                    style: ButtonStyle.Success,
                                    allowedUsers: [interaction.user.id],
                                }).onPressed(async (buttonInteraction) => {
                                    const modal = new Modal({
                                        title: "Add Roles",
                                        inputs: [
                                            new TextInputBuilder()
                                                .setCustomId("list")
                                                .setLabel("List")
                                                .setStyle(TextInputStyle.Paragraph)
                                                .setPlaceholder("Admin,Mod,1276574933551419583,[...]")
                                                .setRequired(true),
                                        ],
                                    });

                                    const response = await modal.prompt(buttonInteraction);
                                    await response.deferUpdate();

                                    const roles = response.fields.getTextInputValue("list").split(",");
                                    const actualRoles = [];
                                    for (const searcher of roles) {
                                        const actualRole = await client.Functions.fetchRole(
                                            searcher.trim(),
                                            interaction.guild as Guild,
                                        );
                                        if (actualRole) actualRoles.push(actualRole.id);
                                    }

                                    guildProfile.addRolesToPermission(
                                        Number.parseInt(permission) as CommandPermission,
                                        actualRoles,
                                    );

                                    updateEmbed();
                                    await interaction.editReply(buttonEmbed.getMessageData());
                                }),
                            );

                            buttonEmbed.addButton(
                                new Button({
                                    label: "Remove Roles",
                                    style: ButtonStyle.Primary,
                                    allowedUsers: [interaction.user.id],
                                }).onPressed(async (buttonInteraction) => {
                                    const modal = new Modal({
                                        title: "Remove Roles",
                                        inputs: [
                                            new TextInputBuilder()
                                                .setCustomId("list")
                                                .setLabel("List")
                                                .setStyle(TextInputStyle.Paragraph)
                                                .setPlaceholder("Admin,Mod,1276574933551419583,[...]")
                                                .setRequired(true),
                                        ],
                                    });

                                    const response = await modal.prompt(buttonInteraction);
                                    await response.deferUpdate();

                                    const roles = response.fields.getTextInputValue("list").split(",");
                                    const actualRoles = [];
                                    for (const searcher of roles) {
                                        const actualRole = await client.Functions.fetchRole(
                                            searcher.trim(),
                                            interaction.guild as Guild,
                                        );
                                        if (actualRole) actualRoles.push(actualRole.id);
                                    }

                                    guildProfile.removeRolesFromPermission(
                                        Number.parseInt(permission) as CommandPermission,
                                        actualRoles,
                                    );

                                    updateEmbed();
                                    await interaction.editReply(buttonEmbed.getMessageData());
                                }),
                            );

                            buttonEmbed.addButton(
                                new Button({
                                    label: "Clear Roles",
                                    style: ButtonStyle.Danger,
                                    allowedUsers: [interaction.user.id],
                                }).onPressed(async (buttonInteraction) => {
                                    await buttonInteraction.deferUpdate();
                                    permissionData.roles = [];

                                    updateEmbed();
                                    await interaction.editReply(buttonEmbed.getMessageData());
                                }),
                            );

                            buttonEmbed.nextRow();

                            buttonEmbed.addButton(
                                new Button({
                                    label: "Save",
                                    style: ButtonStyle.Success,
                                    allowedUsers: [interaction.user.id],
                                }).oncePressed(async (buttonInteraction) => {
                                    await guildProfile.save();
                                    await buttonInteraction.update({
                                        embeds: [
                                            client.Functions.makeSuccessEmbed({
                                                title: "Changes saved",
                                                description: "Permission saved successfully",
                                            }),
                                        ],
                                        components: [],
                                    });
                                }),
                            );

                            buttonEmbed.addButton(
                                new Button({
                                    label: "Remove unknown entries",
                                    style: ButtonStyle.Secondary,
                                    allowedUsers: [interaction.user.id],
                                }).onPressed(async (buttonInteraction) => {
                                    await buttonInteraction.deferUpdate();
                                    permissionData.users = permissionData.users.filter((id) =>
                                        interaction.guild?.members.cache.has(id),
                                    );
                                    permissionData.roles = permissionData.roles.filter((id) =>
                                        interaction.guild?.roles.cache.has(id),
                                    );

                                    updateEmbed();
                                    await interaction.editReply(buttonEmbed.getMessageData());
                                }),
                            );

                            buttonEmbed.addButton(
                                new Button({
                                    label: "Cancel",
                                    style: ButtonStyle.Danger,
                                    allowedUsers: [interaction.user.id],
                                }).oncePressed(async (buttonInteraction) => {
                                    await buttonInteraction.update({
                                        embeds: [
                                            client.Functions.makeErrorEmbed({
                                                title: "Changes cancelled",
                                                description: "Permission changes were cancelled",
                                            }),
                                        ],
                                        components: [],
                                    });
                                }),
                            );

                            await interaction.editReply(buttonEmbed.getMessageData());
                        }
                        break;
                }
                break;
            }
        }
    },
});
