import { SlashCommandSubcommandBuilder, TextChannel } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import Emojis from "../../assets/Emojis.js";

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
        ,

        new SlashCommandSubcommandBuilder()
            .setName("sendannouncement")
            .setDescription("Sends an announcement to all guilds")
            .addStringOption(option =>
                option
                    .setName("message-id")
                    .setDescription("The content of the announcement")
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

                const guildDataProfile = await client.Database.GetGuildProfile(guildId, false);
                const owner = await actualGuild.fetchOwner().then((owner) => owner.user);

                const embed = client.Functions.makeInfoEmbed({
                    title: `Information about \`${actualGuild.name}\``,
                    thumbnail: actualGuild.iconURL() || undefined,
                    image: actualGuild.bannerURL() || undefined,
                    fields: [
                        { name: "Name", value: `${actualGuild.name}`, inline: true },
                        { name: "Id", value: `${actualGuild.id}`, inline: true },
                        { name: "Owner", value: `${owner.username}:\`${owner.id}\`\n<@${owner.id}>`, inline: true },

                        { name: "Member count", value: actualGuild.memberCount.toString(), inline: false }
                    ]
                })

                if (guildDataProfile) embed.addField("Database", `Registered with shortname \`${guildDataProfile.guild.shortname}\``, false);

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

            case "sendannouncement": {
                if (!interaction.channel) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Send Announcement", description: "This command can only be used in a guild" })] });

                const messageId = interaction.options.getString("message-id", true);
                const actualMessage = await interaction.channel.messages.fetch(messageId);

                if (!actualMessage) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Send Announcement", description: "Message not found" })] });

                const messageContent = { content: actualMessage.content, embeds: actualMessage.embeds }

                await interaction.editReply({ embeds: [client.Functions.makeInfoEmbed({ title: "Sending Announcement", description: `${Emojis.thinking} Sending announcement, please wait...` })] })

                const guildDataProfiles = await client.Database.GetAllGuilds();
                for (const guildDataProfile of guildDataProfiles) {
                    const channel = await guildDataProfile.getChannel("BotAnnouncements")
                    if (!channel || !(channel instanceof TextChannel)) continue;

                    try {
                        channel.send(messageContent);
                    } catch (error) {
                    }
                }

                await interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Send Announcement", description: `Sent announcement to ${guildDataProfiles.length} guilds` })] });
            }
        }
    }
})