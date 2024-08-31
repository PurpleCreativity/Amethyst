import { SlashCommandSubcommandBuilder } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";

export default new SlashCommand({
    name: "botmanager",
    description: "Manages the bot",

    defer: true,
    devOnly: true,
    userApp: true,

    subcommands: [
        new SlashCommandSubcommandBuilder()
            .setName("listguilds")
            .setDescription("Lists all guilds")
        ,

        new SlashCommandSubcommandBuilder()
            .setName("guildinfo")
            .setDescription("Shows information about a guild")
            .addStringOption(option =>
                option
                    .setName("guild-id")
                    .setDescription("The guild to id to show information about")
                    .setRequired(true)
            )
        ,
        
        new SlashCommandSubcommandBuilder()
            .setName("leaveguild")
            .setDescription("Leaves a guild")
            .addStringOption(option =>
                option
                    .setName("guild-id")
                    .setDescription("The guild to leave")
                    .setRequired(true)
            )
        ,

        new SlashCommandSubcommandBuilder()
            .setName("registerguild")
            .setDescription("Registers a guild")
            .addStringOption(option =>
                option
                    .setName("guild-id")
                    .setDescription("The guild to register")
                    .setRequired(true)
            )
            .addStringOption(option => 
                option
                    .setName("shortname")
                    .setDescription("The shortname of the guild")
                    .setRequired(true)
            )
    ],

    execute: async (interaction) => {
        const subcommand = interaction.options.getSubcommand(true);
        
        switch (subcommand) {
            case "listguilds": {
                const guilds = await client.guilds.fetch();

                const embed = client.Functions.makeInfoEmbed({
                    title: "List of guilds",
                })

                for (const guild of guilds.values()) {
                    const actualGuild = await client.Functions.GetGuild(guild.id, false);
                    if (!actualGuild) continue;
                    const owner = await actualGuild.fetchOwner().then((owner) => owner.user);

                    embed.setDescription(`${embed.data.description || ""}**${actualGuild.name}** [\`${actualGuild.id}\`]\n(${owner.username}:\`${owner.id}\`)\n\n`);
                }

                return interaction.editReply({ embeds: [embed] });
            }

            case "guildinfo": {
                const guildId = interaction.options.getString("guild-id", true);
                const actualGuild = await client.Functions.GetGuild(guildId, false);
                if (!actualGuild) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Guild Info", description: "Guild not found" })] });
                const owner = await actualGuild.fetchOwner().then((owner) => owner.user);

                const embed = client.Functions.makeInfoEmbed({
                    title: `Information about \`${actualGuild.name}\``,
                    footer: { text: owner.username, iconURL: await owner.avatarURL() || undefined },
                    thumbnail: actualGuild.iconURL() || undefined,
                    image: actualGuild.bannerURL() || undefined,
                    fields: [
                        { name: "Name", value: actualGuild.name, inline: true },
                        { name: "Id", value: actualGuild.id, inline: true },
                        { name: "Owner", value: `${owner.username}:\`${owner.id}\`\n<@${owner.id}>`, inline: true },

                        { name: "Member count", value: actualGuild.memberCount.toString(), inline: false }
                    ]
                })

                return interaction.editReply({ embeds: [embed] });
            }

            case "leaveguild": {
                const guildId = interaction.options.getString("guild-id", true);
                const actualGuild = await client.Functions.GetGuild(guildId, false);
                if (!actualGuild) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Leave Guild", description: "Guild not found" })] });

                await actualGuild.leave();

                return interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Leave Guild", description: `Left \`${actualGuild.name}\`:\`${actualGuild.id}\`` })] });
            }

            case "registerguild": {
                const guildId = interaction.options.getString("guild-id", true);
                const shortname = interaction.options.getString("shortname", true);

                const actualGuild = await client.Functions.GetGuild(guildId, false);
                if (!actualGuild) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Register Guild", description: "Guild not found" })] });

                await client.Database.CreateGuildProfile(actualGuild);
                
                const createdProfile = await client.Database.GetGuildProfile(guildId, false);
                if (!createdProfile) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Register Guild", description: "Failed to create guild profile" })] });

                createdProfile.guild.shortname = shortname;
                await createdProfile.save();

                return interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Register Guild", description: `Registered \`${actualGuild.name}\`:\`${actualGuild.id}\` with shortname \`${shortname}\`` })] });
            }
        }
    }
})