import { SlashCommandSubcommandBuilder } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../main.js";

export default new SlashCommand({
    name: "botmanager",
    description: "Manage the bot",

    developer_only: true,
    user_installable: true,

    subcommands: [
        new SlashCommandSubcommandBuilder()
            .setName("registerguild")
            .setDescription("Register a guild in the database")
            .addStringOption((option) =>
                option.setName("guild-id").setDescription("The guild to register").setRequired(true),
            )
            .addStringOption((option) =>
                option.setName("shortname").setDescription("The shortname to set for the guild").setRequired(true),
            ),
    ],

    function: async (interaction) => {
        const subcommand = interaction.options.getSubcommand(true);

        switch (subcommand) {
            case "registerguild": {
                const guildId = interaction.options.getString("guild-id", true);
                const shortname = interaction.options.getString("shortname", true);

                const existingGuild = await client.Database.fetchGuildProfile(guildId, false);
                if (existingGuild) {
                    await interaction.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "Failed to register guild",
                                description: `Guild **${existingGuild.guild.name}** is already registered in the database with the shortname **${existingGuild.shortname}**`,
                            }),
                        ],
                    });

                    return;
                }

                try {
                    const guild = await client.guilds.fetch(guildId);

                    const profile = await client.Database.createGuildProfile(shortname, guild);
                    profile.addAPIKey("debug", {
                        enabled: true,
                        permissions: ["Administrator"],

                        key: "bananas",

                        createdAt: new Date(),
                        createdBy: interaction.user.id,
                    });
                    await profile.save();

                    await interaction.editReply({
                        embeds: [
                            client.Functions.makeSuccessEmbed({
                                title: "Guild Registered",
                                thumbnail: guild.iconURL() || undefined,
                                description: `Guild **${guild.name}** has been registered in the database with the shortname **${shortname}**`,
                            }),
                        ],
                    });
                } catch (error) {
                    if (!(error instanceof Error)) return;
                    client.error(error.stack);

                    await interaction.editReply({
                        embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "Failed to register guild",
                                description: error.message,
                            }),
                        ],
                    });
                }
            }
        }
    },
});
