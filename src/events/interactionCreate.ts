import { BaseInteraction, MessageFlags } from "discord.js";
import Event from "../classes/Event.js";
import client from "../main.js";

export default new Event({
    type: "client",
    callback: async (interaction) => {
        if (!(interaction instanceof BaseInteraction)) return;

        if (interaction.isChatInputCommand()) {
            const command = client.Interactables.stored.SlashCommands.get(interaction.commandName);
            if (!command) {
                return await interaction.reply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "Command not found",
                            description: "The command you're trying to run doesn't exist.",
                        }),
                    ],
                });
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
                    return await interaction.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occurred",
                                description: "This guild is not registered in the database.",
                            }),
                        ],
                    });
                }

                return await command.execute(interaction, guildProfile);
            } catch (error) {
                const message: string =
                    error && typeof error === "object" && "message" in error
                        ? (error as { message: string }).message
                        : "Unknown error";
                if (error && typeof error === "object" && "stack" in error) client.error(error.stack);

                return await interaction.editReply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occurred",
                            description: `\`\`\`${message}\`\`\``,
                        }),
                    ],
                });
            }
        }

        if (interaction.isAutocomplete()) {
            const command = client.Interactables.stored.SlashCommands.get(interaction.commandName);

            if (!command || !command.autocomplete) return;

            try {
                const choiches = (await command.autocomplete(interaction)) || [];
                if (choiches.length > 25) choiches.splice(25);

                return await interaction.respond(choiches);
            } catch (error) {
                return await interaction.respond([]);
            }
        }

        if (interaction.isUserContextMenuCommand()) {
            const command = client.Interactables.stored.UserContextMenuCommands.get(interaction.commandName);
            if (!command) {
                return await interaction.reply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "Command not found",
                            description: "The command you're trying to run doesn't exist.",
                        }),
                    ],
                });
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
                    return await interaction.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occurred",
                                description: "This guild is not registered in the database.",
                            }),
                        ],
                    });
                }

                return await command.execute(interaction, guildProfile);
            } catch (error) {
                const message: string =
                    error && typeof error === "object" && "message" in error
                        ? (error as { message: string }).message
                        : "Unknown error";
                if (error && typeof error === "object" && "stack" in error) client.error(error.stack);

                return await interaction.editReply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occurred",
                            description: `\`\`\`${message}\`\`\``,
                        }),
                    ],
                });
            }
        }

        if (interaction.isMessageContextMenuCommand()) {
            const command = client.Interactables.stored.MessageContextMenuCommands.get(interaction.commandName);
            if (!command) {
                return await interaction.reply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "Command not found",
                            description: "The command you're trying to run doesn't exist.",
                        }),
                    ],
                });
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
                    return await interaction.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occurred",
                                description: "This guild is not registered in the database.",
                            }),
                        ],
                    });
                }

                return await command.execute(interaction, guildProfile);
            } catch (error) {
                const message: string =
                    error && typeof error === "object" && "message" in error
                        ? (error as { message: string }).message
                        : "Unknown error";
                if (error && typeof error === "object" && "stack" in error) client.error(error.stack);

                return await interaction.editReply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occurred",
                            description: `\`\`\`${message}\`\`\``,
                        }),
                    ],
                });
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId.toLowerCase().startsWith("static_")) {
                const button = client.Interactables.stored.StaticButtons.get(interaction.customId.slice(7));
                if (!button) {
                    return await interaction.reply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "Button not found",
                                description: "The button you're trying to run doesn't exist.",
                            }),
                        ],
                    });
                }

                try {
                    const guildProfile = interaction.guild
                        ? await client.Database.getGuildProfile(interaction.guild.id)
                        : undefined;

                    if (interaction.guild && !guildProfile) {
                        return await interaction.reply({
                            embeds: [
                                client.Functions.makeErrorEmbed({
                                    title: "An error occurred",
                                    description: "This guild is not registered in the database.",
                                }),
                            ],
                        });
                    }

                    return await button.execute(interaction, guildProfile);
                } catch (error) {
                    const message: string =
                        error && typeof error === "object" && "message" in error
                            ? (error as { message: string }).message
                            : "Unknown error";
                    if (error && typeof error === "object" && "stack" in error) client.error(error.stack);

                    if (interaction.deferred) {
                        return await interaction.editReply({
                            embeds: [
                                client.Functions.makeErrorEmbed({
                                    title: "An error occurred",
                                    description: `\`\`\`${message}\`\`\``,
                                }),
                            ],
                        });
                    }

                    return await interaction.reply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occurred",
                                description: `\`\`\`${message}\`\`\``,
                            }),
                        ],
                    });
                }
            }

            return client.emit("buttonInteraction", interaction);
        }

        if (interaction.isModalSubmit()) {
            return client.emit("modalSubmitInteraction", interaction);
        }

        if (interaction.isAnySelectMenu()) {
            return client.emit("selectMenuInteraction", interaction);
        }
    },
});
