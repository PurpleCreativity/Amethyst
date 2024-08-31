import { ButtonStyle, type Guild, type ModalSubmitInteraction, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import Modal from "../../classes/Modal.js";

const channelCommandChoices = [
    { name: "Points Database Updates", value: "PointsDatabaseUpdates" },
    { name: "Point Log Updates", value: "PointLogUpdates" },
    { name: "Schedule Updates", value: "ScheduleUpdates" },
    { name: "Game Logs", value: "GameLogs" },
    { name: "Game Calls", value: "GameCalls" },
    { name: "Roblox Group Logs", value: "RobloxGroupLogs" }
] as { name: string, value: string }[];

const permissionCommandChoices = [
    { name: "Administrator", value: "Administrator" },
    { name: "Moderator", value: "Moderator" },
    { name: "Roblox Moderator", value: "RobloxModerator" },
    { name: "Roblox Group Manager", value: "RobloxGroupManager" },
    { name: "Points Manager", value: "PointsManager" },
    { name: "Points Viewer", value: "PointsViewer" },
    { name: "Create Point Logs", value: "CreatePointLogs" },
    { name: "Event Scheduler", value: "EventScheduler" },
    { name: "Schedule Manager", value: "ScheduleManager" }
] as { name: string, value: string }[];

export default new SlashCommand({
    name: "manageguild",
    description: "Manage the guild",

    customPermissions: ["Administrator"],

    defer: true,

    subcommands: [
        /*
        new SlashCommandSubcommandGroupBuilder()
            .setName("settings")
            .setDescription("Manage the guild settings")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("view")
                    .setDescription("View the guild settings")
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("set")
                    .setDescription("Set a guild setting to the given value")
                    .addStringOption((option) =>
                        option
                            .setName("setting")
                            .setDescription("The setting to set")
                            .setRequired(true)
                    )
                    .addStringOption((option) =>
                        option
                            .setName("value")
                            .setDescription("The value to set the setting to")
                            .setRequired(true)
                    )
            )

        ,
        */

        new SlashCommandSubcommandGroupBuilder()
            .setName("channels")
            .setDescription("Manage your guild channels")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("list")
                    .setDescription("List all channels")
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("set")
                    .setDescription("Set a channel")
                    .addStringOption(option => option
                        .setName("type")
                        .setDescription("The channel to set")
                        .setChoices(channelCommandChoices)
                        .setRequired(true)
                    )
                    .addChannelOption(option => option.setName("channel").setDescription("The value to set").setRequired(true))
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("remove")
                    .setDescription("Remove a channel")
                    .addStringOption(option => option
                        .setName("type")
                        .setDescription("The channel to set")
                        .setChoices(channelCommandChoices)
                        .setRequired(true)
                    )
            )
        ,

        new SlashCommandSubcommandGroupBuilder()
            .setName("permissions")
            .setDescription("Manage your guild permissions")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("list")
                    .setDescription("List all permissions")
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("set")
                    .setDescription("Set Users or Roles to a permission")
                    .addStringOption(option => option
                        .setName("permission")
                        .setDescription("The permission to set")
                        .setChoices(permissionCommandChoices)
                        .setRequired(true)
                    )
            )

        ,

        new SlashCommandSubcommandGroupBuilder()
            .setName("data")
            .setDescription("Manage your guild data")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("export")
                    .setDescription("Export your guild data")
            )

        ,
        
        /*
        new SlashCommandSubcommandGroupBuilder()
            .setName("linkedguilds")
            .setDescription("Manage your linked guilds")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("list")
                    .setDescription("List all linked guilds")
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("info")
                    .setDescription("Get information about a linked guild")
                    .addStringOption(option => option
                        .setName("guild")
                        .setDescription("The guild to get information about")
                        .setRequired(true)
                    )
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("add")
                    .setDescription("Add a linked guild")
                    .addStringOption(option => option
                        .setName("guild-id")
                        .setDescription("The guild to add")
                        .setRequired(true)
                    )
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("remove")
                    .setDescription("Remove a linked guild")
                    .addStringOption(option => option
                        .setName("guild-id")
                        .setDescription("The guild to remove")
                        .setRequired(true)
                    )
            )
        */

    ],

    execute: async (interaction, guildDataProfile) => {
        if (!interaction.guild || !guildDataProfile) return;

        const subcommandGroup = interaction.options.getSubcommandGroup(true);
        const subcommand = interaction.options.getSubcommand(true);

        switch (subcommandGroup) {
            case "channels": {
                switch (subcommand) {
                    case "list": {
                        const embed = client.Functions.makeInfoEmbed({ title: "Channels", description: "Here are all the channels in the guild" })
                        for (const channel of guildDataProfile.guild.channels.values()) {
                            embed.addField(channel.name, channel.id !== "0" ? `<#${channel.id}>` : "\`Unset\`", false)
                        }

                        return interaction.editReply({ embeds: [embed] })
                    }

                    case "set": {
                        const type = interaction.options.getString("type", true);
                        const channel = interaction.options.getChannel("channel", true);

                        const channelData = guildDataProfile.guild.channels.get(type);
                        if (!channelData) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Invalid channel type", description: "The channel type you provided is invalid" })] });

                        channelData.id = channel.id;
                        await guildDataProfile.save();

                        return interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Channel Set", description: `The \`${channelData.name}\` channel has been set to <#${channel.id}>` })] })
                    }

                    case "remove": {
                        const type = interaction.options.getString("type", true);

                        const channelData = guildDataProfile.guild.channels.get(type);
                        if (!channelData) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Invalid channel type", description: "The channel type you provided is invalid" })] });

                        channelData.id = "0";
                        await guildDataProfile.save();

                        return interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Channel Removed", description: `The \`${channelData.name}\` channel has been removed` })] })
                    }
                }

                break;
            }

            case "permissions": {
                switch (subcommand) {
                    case "list": {
                        const embed = client.Functions.makeInfoEmbed({ title: "Permissions", description: "Here are all the permissions in the guild" })
                        for (const permission of guildDataProfile.guild.customPermissions.values()) {
                            const usersString = permission.users.map(user => `<@${user}>`).join(", ") || "\`None\`";
                            const rolesString = permission.roles.map(role => `<@&${role}>`).join(", ") || "\`None\`";

                            embed.addField(permission.name, `Users: ${usersString}\nRoles: ${rolesString}`, false)
                        }

                        return interaction.editReply({ embeds: [embed] })
                    }

                    case "set": {
                        const permission = interaction.options.getString("permission", true);

                        const permissionData = guildDataProfile.guild.customPermissions.get(permission);
                        if (!permissionData) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Invalid permission", description: "The permission you provided is invalid" })] });

                        const buttonEmbed = new ButtonEmbed(client.Functions.makeInfoEmbed({ title: "Add Users or Roles", description: `Please select users or roles to add to \`${permissionData.name}\``, fields: [{ name: "Users", value: permissionData.users.map(user => `<@${user}>`).join(", ") || "\`None\`" }, { name: "Roles", value: permissionData.roles.map(role => `<@&${role}>`).join(", ") || "\`None\`" }] }));

                        const updateEmbed = () => {
                            const embed = buttonEmbed.Embed;
                            embed.setFields([{ name: "Users", value: permissionData.users.map(user => `<@${user}>`).join(", ") || "\`None\`" }, { name: "Roles", value: permissionData.roles.map(role => `<@&${role}>`).join(", ") || "\`None\`" }]);
                        }

                        buttonEmbed.addButton({
                            label: "Add Users",
                            style: ButtonStyle.Primary,
                            allowedUsers: [interaction.user.id],

                            function: async (buttonInteraction) => {
                                const modal = new Modal({
                                    Title: "Add Users",
                                    Inputs: [new TextInputBuilder().setLabel("Users").setCustomId("users").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("servername1,servername2,[...]")],
                                });

                                const response = await modal.Prompt(buttonInteraction) as ModalSubmitInteraction;
                                await response.deferUpdate();

                                const users = response.fields.getTextInputValue("users").split(",");
                                const actualUsers = [];
                                for (const searcher of users) {
                                    const actualUser = await client.Functions.GetUser(searcher.trim(), interaction.guild as Guild);
                                    if (actualUser) actualUsers.push(actualUser.id);
                                }

                                for (const actualUser of actualUsers) {
                                    if (!permissionData.users.includes(actualUser)) permissionData.users.push(actualUser);
                                }

                                updateEmbed();
                                interaction.editReply(buttonEmbed.getMessageData());
                            }
                        });

                        buttonEmbed.addButton({
                            label: "Remove Users",
                            style: ButtonStyle.Secondary,
                            allowedUsers: [interaction.user.id],

                            function: async (buttonInteraction) => {
                                const modal = new Modal({
                                    Title: "Remove Users",
                                    Inputs: [new TextInputBuilder().setLabel("Users").setCustomId("users").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("servername1,servername2,[...]")],
                                });

                                const response = await modal.Prompt(buttonInteraction) as ModalSubmitInteraction;
                                await response.deferUpdate();

                                const users = response.fields.getTextInputValue("users").split(",");
                                const actualUsers = [];
                                for (const searcher of users) {
                                    const actualUser = await client.Functions.GetUser(searcher.trim(), interaction.guild as Guild);
                                    if (actualUser) actualUsers.push(actualUser.id);
                                }

                                for (const actualUser of actualUsers) {
                                    const index = permissionData.users.indexOf(actualUser);
                                    if (index > -1) permissionData.users.splice(index, 1);
                                }

                                updateEmbed();
                                interaction.editReply(buttonEmbed.getMessageData());
                            }
                        });

                        buttonEmbed.addButton({
                            label: "Clear Users",
                            style: ButtonStyle.Danger,
                            allowedUsers: [interaction.user.id],

                            function: async (buttonInteraction) => {
                                await buttonInteraction.deferUpdate();
                                
                                permissionData.users = [];
                                updateEmbed();
                                interaction.editReply(buttonEmbed.getMessageData());
                            }
                        })

                        buttonEmbed.nextRow();

                        buttonEmbed.addButton({
                            label: "Add Roles",
                            style: ButtonStyle.Primary,
                            allowedUsers: [interaction.user.id],

                            function: async (buttonInteraction) => {
                                const modal = new Modal({
                                    Title: "Add Roles",
                                    Inputs: [new TextInputBuilder().setLabel("Roles").setCustomId("roles").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("rolename1,rolename2,[...]")],
                                });

                                const response = await modal.Prompt(buttonInteraction) as ModalSubmitInteraction;
                                await response.deferUpdate();

                                const roles = response.fields.getTextInputValue("roles").split(",");
                                const actualRoles = [];
                                for (const searcher of roles) {
                                    const actualRole = await client.Functions.GetRole(searcher, interaction.guild as Guild);
                                    if (actualRole) actualRoles.push(actualRole.id);
                                }

                                for (const actualRole of actualRoles) {
                                    if (!permissionData.roles.includes(actualRole)) permissionData.roles.push(actualRole);
                                }

                                updateEmbed();
                                interaction.editReply(buttonEmbed.getMessageData());
                            }
                        });

                        buttonEmbed.addButton({
                            label: "Remove Roles",
                            style: ButtonStyle.Secondary,
                            allowedUsers: [interaction.user.id],

                            function: async (buttonInteraction) => {
                                const modal = new Modal({
                                    Title: "Remove Roles",
                                    Inputs: [new TextInputBuilder().setLabel("Roles").setCustomId("roles").setStyle(TextInputStyle.Paragraph).setRequired(true).setPlaceholder("rolename1,rolename2,[...]")],
                                });

                                const response = await modal.Prompt(buttonInteraction) as ModalSubmitInteraction;
                                await response.deferUpdate();

                                const roles = response.fields.getTextInputValue("roles").split(",");
                                const actualRoles = [];
                                for (const searcher of roles) {
                                    const actualRole = await client.Functions.GetRole(searcher, interaction.guild as Guild);
                                    if (actualRole) actualRoles.push(actualRole.id);
                                }

                                for (const actualRole of actualRoles) {
                                    const index = permissionData.roles.indexOf(actualRole);
                                    if (index > -1) permissionData.roles.splice(index, 1);
                                }

                                updateEmbed();
                                interaction.editReply(buttonEmbed.getMessageData());
                            }
                        });

                        buttonEmbed.addButton({
                            label: "Clear Roles",
                            style: ButtonStyle.Danger,
                            allowedUsers: [interaction.user.id],

                            function: async (buttonInteraction) => {
                                await buttonInteraction.deferUpdate();

                                permissionData.roles = [];
                                updateEmbed();
                                interaction.editReply(buttonEmbed.getMessageData());
                            }
                        })

                        buttonEmbed.nextRow();

                        buttonEmbed.addButton({
                            label: "Save Changes",
                            style: ButtonStyle.Success,
                            allowedUsers: [interaction.user.id],

                            function: async (buttonInteraction) => {
                                await buttonInteraction.deferUpdate();

                                await guildDataProfile.save();
                                return interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Permission Saved", description: `The \`${permissionData.name}\` permission has been saved` })], components: [] })
                            }
                        })

                        buttonEmbed.addButton({
                            label: "Cancel",
                            style: ButtonStyle.Danger,
                            allowedUsers: [interaction.user.id],

                            function: async (buttonInteraction) => {
                                await buttonInteraction.deferUpdate();

                                return interaction.editReply({ embeds: [client.Functions.makeInfoEmbed({ title: "Cancelled", description: `The \`${permissionData.name}\` permission changes have not been saved` })], components: [] })
                            }
                        });

                        return interaction.editReply(buttonEmbed.getMessageData());
                    }
                }

                break;
            }

            case "data": {
                switch (subcommand) {
                    case "export": {
                        try {
                            await interaction.user.send({ content: "Here is your guild data", files: [{ attachment: Buffer.from(JSON.stringify(guildDataProfile.toJSON(), null, 2), "utf-8"), name: `guild_${interaction.guild.id}_data.json` }] })

                            return interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Export successful", description: "Please check your DMs"}) ]});
                        } catch (error) {
                            return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Failed to export data", description: "I was unable to send you the data file" })] })
                        }
                    }
                }

                break;
            }
        }
    }
})