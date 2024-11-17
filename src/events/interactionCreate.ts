import { BaseInteraction } from "discord.js";
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
                const guildProfile = interaction.guild
                    ? await client.Database.fetchGuildProfile(interaction.guild.id)
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

                return await command.execute(interaction, guildProfile);
            } catch (error) {
                if (!(error instanceof Error)) return;

                client.error(error.stack);

                if (interaction.deferred) {
                    return await interaction.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occurred",
                                description: `\`\`\`${error.message}\`\`\``,
                            }),
                        ],
                    });
                }

                return await interaction.reply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occurred",
                            description: `\`\`\`${error.message}\`\`\``,
                        }),
                    ],
                });
            }
        }

        if (interaction.isAutocomplete()) {
            const command = client.Interactables.stored.SlashCommands.get(interaction.commandName);

            if (!command || !command.autocomplete) return;

            const guildProfile = interaction.guild
                ? await client.Database.fetchGuildProfile(interaction.guild.id)
                : undefined;
            if (interaction.guild && !guildProfile) {
                return await interaction.respond([]);
            }

            const choiches = (await command.autocomplete(interaction, guildProfile)) || [];
            if (choiches.length > 25) choiches.splice(25);

            return await interaction.respond(choiches);
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
                const guildProfile = interaction.guild
                    ? await client.Database.fetchGuildProfile(interaction.guild.id)
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

                return await command.execute(interaction, guildProfile);
            } catch (error) {
                if (!(error instanceof Error)) return;

                if (interaction.deferred) {
                    return await interaction.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occurred",
                                description: `\`\`\`${error.message}\`\`\``,
                            }),
                        ],
                    });
                }

                return await interaction.reply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occurred",
                            description: `\`\`\`${error.message}\`\`\``,
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
                const guildProfile = interaction.guild
                    ? await client.Database.fetchGuildProfile(interaction.guild.id)
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

                return await command.execute(interaction, guildProfile);
            } catch (error) {
                if (!(error instanceof Error)) return;

                if (interaction.deferred) {
                    return await interaction.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occurred",
                                description: `\`\`\`${error.message}\`\`\``,
                            }),
                        ],
                    });
                }

                return await interaction.reply({
                    embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occurred",
                            description: `\`\`\`${error.message}\`\`\``,
                        }),
                    ],
                });
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId.toLowerCase().startsWith("static_")) {
                //? Static Button
                return;
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
