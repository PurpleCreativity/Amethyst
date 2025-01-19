import { BaseInteraction, MessageFlags } from "discord.js";
import Event from "../classes/Event.js";
import client from "../main.js";

export default new Event({
    type: "client",
    listener: async (interaction) => {
        if (!(interaction instanceof BaseInteraction)) return;

        if (interaction.isButton()) {
            client.emit("buttonInteraction", interaction);
            return;
        }

        if (interaction.isStringSelectMenu()) {
            client.emit("stringSelectMenuInteraction", interaction);
            return;
        }

        if (interaction.isModalSubmit()) {
            client.emit("modalSubmitInteraction", interaction);
            return;
        }

        if (interaction.isChatInputCommand()) {
            const command = client.Interactables.stored.SlashCommands.get(interaction.commandName);
            if (!command) {
                await interaction.reply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "Command not found",
                            description: "The command you're trying to run doesn't exist.",
                        }),
                    ],
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            try {
                await interaction.deferReply({
                    flags: command.ephemeral ? MessageFlags.Ephemeral : undefined,
                });

                const guildProfile =
                    interaction.guild && !command.userApp
                        ? await client.Database.getGuildProfile(interaction.guild.id)
                        : undefined;

                if (interaction.guild && !guildProfile && !command.userApp) {
                    await interaction.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occurred",
                                description: "This guild is not registered in the database.",
                            }),
                        ],
                    });
                    return;
                }

                await command.execute(interaction, guildProfile);
            } catch (error) {
                const message = client.Functions.formatErrorMessage(error);

                await interaction.editReply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occurred",
                            description: `\`\`\`${message}\`\`\``,
                        }),
                    ],
                });
            }
            return;
        }

        if (interaction.isMessageContextMenuCommand()) {
            const command = client.Interactables.stored.MessageContextMenuCommands.get(interaction.commandName);
            if (!command) {
                await interaction.reply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "Command not found",
                            description: "The command you're trying to run doesn't exist.",
                        }),
                    ],
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            try {
                await interaction.deferReply({
                    flags: command.ephemeral ? MessageFlags.Ephemeral : undefined,
                });

                const guildProfile =
                    interaction.guild && !command.userApp
                        ? await client.Database.getGuildProfile(interaction.guild.id)
                        : undefined;

                if (interaction.guild && !guildProfile && !command.userApp) {
                    await interaction.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occurred",
                                description: "This guild is not registered in the database.",
                            }),
                        ],
                    });
                    return;
                }

                await command.execute(interaction, guildProfile);
            } catch (error) {
                const message = client.Functions.formatErrorMessage(error);

                await interaction.editReply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occurred",
                            description: `\`\`\`${message}\`\`\``,
                        }),
                    ],
                });
            }
            return;
        }

        if (interaction.isUserContextMenuCommand()) {
            const command = client.Interactables.stored.UserContextMenuCommands.get(interaction.commandName);
            if (!command) {
                await interaction.reply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "Command not found",
                            description: "The command you're trying to run doesn't exist.",
                        }),
                    ],
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            try {
                await interaction.deferReply({
                    flags: command.ephemeral ? MessageFlags.Ephemeral : undefined,
                });

                const guildProfile =
                    interaction.guild && !command.userApp
                        ? await client.Database.getGuildProfile(interaction.guild.id)
                        : undefined;

                if (interaction.guild && !guildProfile && !command.userApp) {
                    await interaction.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occurred",
                                description: "This guild is not registered in the database.",
                            }),
                        ],
                    });
                    return;
                }

                await command.execute(interaction, guildProfile);
            } catch (error) {
                const message = client.Functions.formatErrorMessage(error);

                await interaction.editReply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occurred",
                            description: `\`\`\`${message}\`\`\``,
                        }),
                    ],
                });
            }
            return;
        }
    },
});
