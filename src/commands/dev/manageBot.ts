import { SlashCommandSubcommandBuilder } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";

const command = new SlashCommand({
    name: "botmanager",
    description: "Manages the bot",

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

                return interaction.reply({ embeds: [embed] });
            }

            case "guildinfo": {
                const guildId = interaction.options.getString("guild-id", true);
                const actualGuild = await client.Functions.GetGuild(guildId, false);
                if (!actualGuild) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Guild Info", description: "Guild not found" })], ephemeral: true });
                const owner = await actualGuild.fetchOwner().then((owner) => owner.user);

                console.log(actualGuild)

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

                return interaction.reply({ embeds: [embed] });
            }

            case "leaveguild": {
                const guildId = interaction.options.getString("guild-id", true);
                const actualGuild = await client.Functions.GetGuild(guildId, false);
                if (!actualGuild) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Leave Guild", description: "Guild not found" })], ephemeral: true });

                await actualGuild.leave();

                return interaction.reply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Leave Guild", description: `Left \`${actualGuild.name}\`:\`${actualGuild.id}\`` })] });
            }
        }
    }
})

export default command;