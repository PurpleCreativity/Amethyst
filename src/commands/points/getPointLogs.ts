import { ButtonStyle, type GuildMember, SlashCommandStringOption } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import Emojis from "../../assets/Emojis.js";
import Icons from "../../assets/Icons.js";

export default new SlashCommand({
    name: "getlogs",
    description: "Get pointlogs with given filtering",

    customPermissions: ["PointsManager"],

    defer: true,

    options: [
        new SlashCommandStringOption()
            .setName("pointlog-id")
            .setDescription("The id of the pointlog")
            .setRequired(false)
        ,

        new SlashCommandStringOption()
            .setName("creator-filter")
            .setDescription("Filters by creator (Username or Id)")
            .setRequired(false)
        ,

        new SlashCommandStringOption()
            .setName("included-filter")
            .setDescription("Filters by included user (Username or Id)")
            .setRequired(false)
    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);

        const pointlogId = interaction.options.getString("pointlog-id", false);
        const creatorFilter = interaction.options.getString("creator-filter", false);
        const includedFilter = interaction.options.getString("included-filter", false);

        let pointLogs = await guildDataProfile.getAllPointLogs();

        if (creatorFilter) {
            const actualCreator = await client.Functions.GetRobloxUser(creatorFilter);
            if (!actualCreator) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Get Logs", description: "Creator not found" })], ephemeral: true });

            pointLogs = pointLogs.filter(pointLog => pointLog.creator.id === actualCreator.id);
        }

        if (includedFilter) {
            const actualIncludedUser = await client.Functions.GetRobloxUser(includedFilter);
            if (!actualIncludedUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Get Logs", description: "Target not found" })], ephemeral: true });
            
            pointLogs = pointLogs.filter(pointlog => pointlog.data.some(user => user.id === actualIncludedUser.id));
        }

        if (pointlogId) pointLogs = pointLogs.filter(pointlog => pointlog.id === pointlogId);

        if (pointLogs.length === 0) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Get Logs", description: "No point logs found" })] });

        const embeds = [] as ButtonEmbed[];

        for (const pointlog of pointLogs) {
            const baseEmbed = client.Functions.makePointlogEmbed(pointlog);
            const buttonEmbed = new ButtonEmbed(baseEmbed);

            buttonEmbed.addButton({
                label: "Full Data",
                style: ButtonStyle.Secondary,
                emoji: Emojis.folder_open,
                allowedUsers: [interaction.user.id],

                function: async (buttonInteraction) => {
                    const pointsMap: { [key: number]: string[] } = {};
    
                    for (const user of pointlog.data) {
                        if (!pointsMap[user.points]) {
                            pointsMap[user.points] = [];
                        }
                        pointsMap[user.points].push(user.username);
                    }

                    const userText = Object.entries(pointsMap)
                        .map(([points, usernames]) => `${points} - ${usernames.map(username => `${username}`).join(', ')}`)
                        .join('\n');

                    const userBuffer = Buffer.from(userText, 'utf-8');

                    await buttonInteraction.reply({ files: [{ name: `pointlog_${pointlog.id}_fulldata.txt`, attachment: userBuffer }], ephemeral: true });
                }
            })

            buttonEmbed.nextRow();

            const importButton = buttonEmbed.addButton({
                label: "Import",
                style: ButtonStyle.Success,
                emoji: Emojis.import,
                allowedUsers: [interaction.user.id],

                function: async (buttonInteraction) => {
                    await buttonInteraction.deferUpdate();
                    try {
                        const successEmbed = client.Functions.makePointlogEmbed(pointlog);
                        successEmbed.setColor(0x00ff00);
                        successEmbed.setAuthor({ name: "Imported", iconURL: Icons.check });
                        successEmbed.setTimestamp();

                        await guildDataProfile.importPointLog(pointlog.id);
                        await buttonInteraction.message.edit({ embeds: [successEmbed], components: [] });
                    } catch (error) {
                        if (!(error instanceof Error)) return;
                        client.Logs.LogError(error);
                        await buttonInteraction.message.edit({ embeds: [client.Functions.makeErrorEmbed({ title: "Import Failed", description: `Failed to import point log with id \`${pointlog.id}\`: \n# \`${error.name}\`\n\`\`\`${error.message}\`\`\``, footer: { text: "If this error persists, please contact the bot developer" } })], components: [] });
                    }
                }
            })
            
            buttonEmbed.addButton({
                label: "Delete",
                style: ButtonStyle.Danger,
                emoji: Emojis.delete,
                allowedUsers: [interaction.user.id],

                function: async (buttonInteraction) => {
                    try {
                        const successEmbed = client.Functions.makePointlogEmbed(pointlog);
                        successEmbed.setColor(0xff0000);
                        successEmbed.setAuthor({ name: "Deleted", iconURL: Icons.close });
                        successEmbed.setTimestamp();

                        await guildDataProfile.deletePointLog(pointlog.id);
                        await buttonInteraction.message.edit({ embeds: [successEmbed], components: [] });
                    } catch (error) {
                        if (!(error instanceof Error)) return;
                        client.Logs.LogError(error);
                        await buttonInteraction.message.edit({ embeds: [client.Functions.makeErrorEmbed({ title: "Deletion Failed", description: `Failed to delete point log with id \`${pointlog.id}\`: \n# \`${error.name}\`\n\`\`\`${error.message}\`\`\``, footer: { text: "If this error persists, please contact the bot developer" } })], components: [] });
                    }
                }
            })

            const canImportLogs = await guildDataProfile.customPermissionCheck(interaction.member as GuildMember, ["PointsManager"]);
            if (canImportLogs) buttonEmbed.enableButton(importButton); else buttonEmbed.disableButton(importButton);

            embeds.push(buttonEmbed);
        }

        let description = `Found \`${pointLogs.length}\` pending point logs`
        if (creatorFilter || includedFilter) description += " with given filters"

        await interaction.editReply({ embeds: [client.Functions.makeInfoEmbed({ title: "All Logs", description: description })]});
        for (const embed of embeds) {
            try {
                await interaction.channel?.send(embed.getMessageData());
            } catch (error) {
                if (!(error instanceof Error)) return;
                client.Logs.LogError(error);
                await interaction.followUp({ embeds: [client.Functions.makeErrorEmbed({ title: error.name, description: `Failed to send point log \`${embed.Embed.data.title}\`\n\n\`\`\`${error.message}\`\`\``, footer: { text: "If this error persists, please contact the bot developer" } })], ephemeral: true });
            }
        }
    }
})