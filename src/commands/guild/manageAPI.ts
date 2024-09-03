import { ButtonStyle, type ModalSubmitInteraction, SlashCommandSubcommandBuilder, type StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import type { APIKey } from "../../schemas/guildProfile.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import Modal from "../../classes/Modal.js";
import StringSelector from "../../classes/StringSelector.js";
import Emojis from "../../assets/Emojis.js";
import Icons from "../../assets/Icons.js";

const permissionOptions = [
    new StringSelectMenuOptionBuilder().setLabel("Administrator").setDescription("Grants all permissions").setValue("Administrator"),
    new StringSelectMenuOptionBuilder().setLabel("ViewPoints").setDescription("View points for any user").setValue("ViewPoints"),
    new StringSelectMenuOptionBuilder().setLabel("ViewSchedule").setDescription("View scheduled events").setValue("ViewSchedule"),
    new StringSelectMenuOptionBuilder().setLabel("Moderation").setDescription("Moderation related routes").setValue("Moderation"),
    new StringSelectMenuOptionBuilder().setLabel("CreatePointLogs").setDescription("Grants permission to make pointlogs").setValue("CreatePointLogs"),
    new StringSelectMenuOptionBuilder().setLabel("Roblox").setDescription("Grants roblox-related permissions, required for robloxreturn").setValue("Roblox")
]

export default new SlashCommand({
    name: "manageapi",
    description: "Manage the API",

    defer: true,

    customPermissions: ["Administrator"],
    
    subcommands: [
        new SlashCommandSubcommandBuilder()
            .setName("generatekey")
            .setDescription("Create a new API key")
        ,

        new SlashCommandSubcommandBuilder()
            .setName("managekey")
            .setDescription("Manage an API key")
            .addStringOption(option =>
                option
                    .setName("key")
                    .setDescription("The key to manage")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
        ,

        new SlashCommandSubcommandBuilder()
            .setName("listkeys")
            .setDescription("List all API keys")
        ,

        new SlashCommandSubcommandBuilder()
            .setName("toggle")
            .setDescription("Toggle the entire API")
            .addBooleanOption(option =>
                option
                    .setName("enabled")
                    .setDescription("Whether the API should be enabled")
                    .setRequired(true)
            )
    ],

    execute: async (interaction, guildDataProfile) => {
        if (!interaction.guild || !guildDataProfile) return;

        const subcommand = interaction.options.getSubcommand(true);

        switch (subcommand) {
            case "generatekey": {
                const keys = guildDataProfile.API.keys;
                if (keys.size >= 25) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Manage API", description: "You can only have a maximum of 25 API keys per guild." })] });

                const currentKey = {
                    name: "",
                    key: client.Functions.Encypt(client.API.GenerateKey(), guildDataProfile.iv),

                    enabled: true,
                    permissions: [],

                    createdAt: new Date(),
                    createdBy: interaction.user.id
                } as APIKey;

                const baseEmbed = client.Functions.makeInfoEmbed({ title: "Create API Key", description: "Use the buttons below to set the data of the API key." });
                const buttonEmbed = new ButtonEmbed(baseEmbed);

                const updateEmbed = () => {
                    const embed = baseEmbed;

                    embed.setFields([]);
                    embed.addFields([
                        { name: "Name", value: currentKey.name === "" ? "\`Unset\`" : `\`${currentKey.name}\``, inline: false },
                        { name: "Permissions", value: currentKey.permissions.length === 0 ? "\`Unset\`" : currentKey.permissions.map(permission => `\`${permission}\``).join(", "), inline: false },
                        { name: "Enabled", value: `\`${currentKey.enabled}\``, inline: true },
                    ])

                    buttonEmbed.setEmbed(embed);
                }

                buttonEmbed.addButton({
                    label: "Set Name",
                    style: ButtonStyle.Primary,
                    emoji: Emojis.description,
                    allowedUsers: [interaction.user.id],

                    function: async (buttonInteraction) => {
                        const modal = new Modal({
                            Title: "Set Name",
                            Inputs: [
                                new TextInputBuilder()
                                    .setCustomId("name")
                                    .setLabel("Name")
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setMaxLength(25)
                                    .setRequired(true)
                            ]
                        })
        
                        const response = await modal.Prompt(buttonInteraction) as ModalSubmitInteraction;
                        await response.deferUpdate();
                        currentKey.name = response.fields.getTextInputValue("name");

                        if (
                            currentKey.name !== "" &&
                            currentKey.permissions.length !== 0
                        ) buttonEmbed.enableButton(generateKey); else buttonEmbed.disableButton(generateKey);

                        updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
                    }
                });

                buttonEmbed.nextRow();

                buttonEmbed.addButton({
                    label: "Set Permissions",
                    style: ButtonStyle.Primary,
                    emoji: Emojis.permissions,
                    allowedUsers: [interaction.user.id],

                    function: async (buttonInteraction) => {
                        const selector = new StringSelector({
                            Placeholder: "Select Permissions",
                            allowedUsers: [interaction.user.id],
                            Options: permissionOptions,

                            MaxValues: permissionOptions.length,
                            MinValues: 0
                        });

                        const response = await selector.Prompt(buttonInteraction, client.Functions.makeInfoEmbed({ title: "Set Permissions", description: "Select permissions to set (leave blank to clear)" }));

                        if (!response.values) return;
                        if (response.values.includes("Administrator")) response.values = ["Administrator"];
                        currentKey.permissions = response.values || [];

                        if (
                            currentKey.name !== "" &&
                            currentKey.permissions.length !== 0
                        ) buttonEmbed.enableButton(generateKey); else buttonEmbed.disableButton(generateKey);

                        updateEmbed();
                        await interaction.editReply(buttonEmbed.getMessageData());
                    }
                });

                buttonEmbed.addButton({
                    label: "Toggle Enabled",
                    style: ButtonStyle.Secondary,
                    allowedUsers: [interaction.user.id],

                    function: async (buttonInteraction) => {
                        await buttonInteraction.deferUpdate();
                        currentKey.enabled = !currentKey.enabled;

                        updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
                    }
                });

                buttonEmbed.nextRow();

                const generateKey = buttonEmbed.addButton({
                    label: "Generate Key",
                    style: ButtonStyle.Success,
                    emoji: Emojis.check,
                    allowedUsers: [interaction.user.id],

                    function: async (buttonInteraction) => {
                        await buttonInteraction.deferReply({ ephemeral: true });

                        try {
                            guildDataProfile.API.keys.set(currentKey.name, currentKey);
                            await guildDataProfile.save();

                            const baseEmbed2 = client.Functions.makeInfoEmbed({ title: "API Key Generated", description: "Your API key has been generated with the following data:", fields: [ { name: "Name", value: currentKey.name }, { name: "Permissions", value: currentKey.permissions.map(permission => `\`${permission}\``).join(", ") }, { name: "Enabled", value: `\`${currentKey.enabled}\``, inline: true } ], color: 0x00ff00, author: { name: "Generated", iconURL: Icons.check } })
                            const buttonEmbed2 = new ButtonEmbed(baseEmbed2);

                            const revealKey = buttonEmbed2.addButton({
                                label: "Reveal Key",
                                style: ButtonStyle.Danger,
                                allowedUsers: [interaction.user.id],

                                function: async (buttonInteraction2) => {
                                    buttonEmbed2.disableButton(revealKey);
                                    await buttonInteraction2.message.edit(buttonEmbed2.getMessageData());
                                    await buttonInteraction2.reply({ content: `\`\`\`${client.Functions.Decrypt(currentKey.key, guildDataProfile.iv)}\`\`\``, ephemeral: true });
                                }
                            })

                            await interaction.deleteReply();
                            await buttonInteraction.editReply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Key Generated", description: "Please check your DMs" })], components: [] });
                            await interaction.user.send(buttonEmbed2.getMessageData());
                        } catch (error) {
                            return buttonInteraction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Generate Key", description: "I was unable to send you a direct message!" })]})
                        }
                    }
                })

                buttonEmbed.addButton({
                    label: "Cancel",
                    style: ButtonStyle.Danger,
                    emoji: Emojis.delete,
                    allowedUsers: [interaction.user.id],

                    function: async (buttonInteraction) => {
                        await buttonInteraction.deferUpdate();

                        await interaction.editReply({ embeds: [client.Functions.makeInfoEmbed({ title: "Generate Key", description: "API key creation cancelled", color: 0xff0000, author: { name: "Cancelled", iconURL: Icons.close } })], components: [] });
                    }
                })

                updateEmbed();
                buttonEmbed.disableButton(generateKey);
                return interaction.editReply(buttonEmbed.getMessageData());
            }

            case "managekey": {
                const existingKey = guildDataProfile.API.keys.get(interaction.options.getString("key", true));
                if (!existingKey) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Manage API Key", description: "Key not found" })] });
                const currentKey = JSON.parse(JSON.stringify(existingKey));

                const baseEmbed = client.Functions.makeInfoEmbed({ title: "Manage API Key", description: `Created by <@${currentKey.createdBy}> on <t:${Math.round(new Date(currentKey.createdAt).getTime() / 1000)}:F>` });
                const buttonEmbed = new ButtonEmbed(baseEmbed);

                const updateEmbed = () => {
                    const embed = baseEmbed;

                    embed.setFields([]);
                    embed.addFields([
                        { name: "Name", value: currentKey.name === "" ? "\`Unset\`" : `\`${currentKey.name}\``, inline: false },
                        { name: "Permissions", value: currentKey.permissions.length === 0 ? "\`Unset\`" : currentKey.permissions.map((permission: any) => `\`${permission}\``).join(", "), inline: false },
                        { name: "Enabled", value: `\`${currentKey.enabled}\``, inline: true },
                    ])

                    buttonEmbed.setEmbed(embed);
                }

                buttonEmbed.addButton({
                    label: "Edit Name",
                    style: ButtonStyle.Secondary,
                    emoji: Emojis.description,
                    allowedUsers: [interaction.user.id],

                    function: async (buttonInteraction) => {
                        const modal = new Modal({
                            Title: "Set Name",
                            Inputs: [
                                new TextInputBuilder()
                                    .setCustomId("name")
                                    .setLabel("Name")
                                    .setStyle(TextInputStyle.Paragraph)
                                    .setMaxLength(25)
                                    .setRequired(true)
                            ]
                        })
        
                        const response = await modal.Prompt(buttonInteraction) as ModalSubmitInteraction;
                        await response.deferUpdate();
                        currentKey.name = response.fields.getTextInputValue("name");

                        updateEmbed();
                        await interaction.editReply(buttonEmbed.getMessageData());
                    }
                });

                buttonEmbed.nextRow();

                buttonEmbed.addButton({
                    label: "Set Permissions",
                    style: ButtonStyle.Primary,
                    emoji: Emojis.permissions,
                    allowedUsers: [interaction.user.id],

                    function: async (buttonInteraction) => {
                        const selector = new StringSelector({
                            Placeholder: "Select Permissions",
                            allowedUsers: [interaction.user.id],
                            Options: permissionOptions,

                            MaxValues: permissionOptions.length,
                            MinValues: 0
                        });

                        const response = await selector.Prompt(buttonInteraction, client.Functions.makeInfoEmbed({ title: "Set Permissions", description: "Select permissions to set (leave blank to clear)" }));

                        if (!response.values) return;
                        if (response.values.includes("Administrator")) response.values = ["Administrator"];
                        currentKey.permissions = response.values || [];

                        updateEmbed();
                        await interaction.editReply(buttonEmbed.getMessageData());
                    }
                });

                buttonEmbed.nextRow();

                buttonEmbed.addButton({
                   label: "Toggle Enabled",
                   style: ButtonStyle.Secondary,
                   allowedUsers: [interaction.user.id],
                   
                   function: async (buttonInteraction) => {
                       await buttonInteraction.deferUpdate();
                       currentKey.enabled = !currentKey.enabled;

                       updateEmbed();
                       await interaction.editReply(buttonEmbed.getMessageData());
                   }
                });

                buttonEmbed.nextRow();

                buttonEmbed.addButton({
                    label: "Save Changes",
                    style: ButtonStyle.Success,
                    emoji: Emojis.check,
                    allowedUsers: [interaction.user.id],

                    function: async (buttonInteraction) => {
                        await buttonInteraction.deferUpdate();

                        currentKey.createdBy = interaction.user.id;
                        currentKey.createdAt = new Date();
                        guildDataProfile.API.keys.set(existingKey.name, currentKey);
                        await guildDataProfile.save();

                        await interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Manage API Key", description: "Key has been updated" })], components: [] });
                    }
                });

                buttonEmbed.addButton({
                    label: "Delete Key",
                    style: ButtonStyle.Danger,
                    emoji: Emojis.delete,
                    allowedUsers: [interaction.user.id],

                    function: async (buttonInteraction) => {
                        await buttonInteraction.deferUpdate();
                        await interaction.deleteReply();
                        guildDataProfile.API.keys.delete(existingKey.name);
                        await guildDataProfile.save();
                    }
                })

                updateEmbed();
                return interaction.editReply(buttonEmbed.getMessageData());
            }

            case "listkeys": {
                const keys = Array.from(guildDataProfile.API.keys.values());
                if (keys.length === 0) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Manage API Keys", description: "No keys found" })] });

                const embeds = [];
                for (const key of keys) {
                    const embed = client.Functions.makeInfoEmbed({
                        title: `\`${key.name}\``,
                        description: `Created by <@${key.createdBy}> on <t:${Math.round(new Date(key.createdAt).getTime() / 1000)}:F>`,
                        fields: [
                            { name: "Enabled", value: `\`${key.enabled}\``, inline: true },
                            { name: "Permissions", value: key.permissions.length === 0 ? "\`Unset\`" : key.permissions.map(permission => `\`${permission}\``).join(", "), inline: true },
                        ]
                    });

                    embeds.push(embed);
                }

                
                await interaction.editReply({ embeds: [client.Functions.makeInfoEmbed({ title: "Key List", description: `Found ${keys.length} keys` })] });

                if (!(interaction.channel instanceof TextChannel)) return;
                for (const embed of embeds) {
                    try {
                        await interaction.channel.send({ embeds: [embed] });
                    } catch (error) {
                        await interaction.followUp({ embeds: [client.Functions.makeErrorEmbed({ title: "Manage API Keys", description: "Could not send embed for a key" })], ephemeral: true });
                    }
                }

                break;
            }

            case "toggle": {
                const enabled = interaction.options.getBoolean("enabled", true);
                guildDataProfile.API.enabled = enabled;
                await guildDataProfile.save();

                if (enabled) {
                    return interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({ title: "API Enabled", description: "The API has been \`enabled\`" })] });
                }
                return interaction.editReply({ embeds: [client.Functions.makeWarnEmbed({ title: "API Disabled", description: "The API has been \`+disabled\`" })] });
            }
        }
    },

    autocomplete: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);
        if (!guildDataProfile) return [];

        const currentOption = interaction.options.getFocused(true);

        switch (currentOption.name) {
            case "key": return Array.from(guildDataProfile.API.keys.values()).map(key => ({ name: key.name, value: key.name }))
        }
    }
})