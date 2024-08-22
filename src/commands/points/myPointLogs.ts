import { ButtonStyle, type GuildMember } from "discord.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import Emojis from "../../assets/Emojis.js";

const command = new SlashCommand({
    name: "mylogs",
    description: "Shows your point logs",

    module: "Points",
    customPermissions: ["PointsManager"],

    execute: async (interaction) => {
        if (!interaction.guild) return;
        const robloxUser = await client.Functions.GetLinkedRobloxUser(interaction.user.id);
        if (!robloxUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Your Logs", description: "You are not linked to a Roblox account" })], ephemeral: true });

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);
        let pointLogs = await guildDataProfile.getAllPointLogs();
        pointLogs = pointLogs.filter(pointlog => pointlog.creator.id === robloxUser.id);
        if (pointLogs.length === 0) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Your Logs", description: "You have no point logs" })], ephemeral: true });

        const embeds = [];

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

                    await buttonInteraction.reply({ files: [{ name: `pointlog_fulldata_${pointlog.id}.txt`, attachment: userBuffer }], ephemeral: true });
                }
            })

            buttonEmbed.nextRow();

            const importButton = buttonEmbed.addButton({
                label: "Import",
                style: ButtonStyle.Success,
                emoji: Emojis.import,
                allowedUsers: [interaction.user.id],

                function: async (buttonInteraction) => {
                    
                }
            })
            
            buttonEmbed.addButton({
                label: "Delete",
                style: ButtonStyle.Danger,
                emoji: Emojis.delete,
                allowedUsers: [interaction.user.id],

                function: async (buttonInteraction) => {
                    
                }
            })

            const canImportLogs = await guildDataProfile.customPermissionCheck(interaction.member as GuildMember, ["PointsManager"]);
            console.log(canImportLogs)
            if (canImportLogs) buttonEmbed.enableButton(importButton); else buttonEmbed.disableButton(importButton);

            embeds.push(buttonEmbed);
        }

        await interaction.reply({ embeds: [client.Functions.makeInfoEmbed({ title: "Your Point Logs", description: `You have ${pointLogs.length} pending point logs.`}) ]})
        for (const embed of embeds) {
            try {
                await interaction.channel?.send(embed.getMessageData());
            } catch (error) {
                if (!(error instanceof Error)) return;
                await interaction.followUp({ embeds: [client.Functions.makeErrorEmbed({ title: error.name, description: `Failed to send point log \`${embed.Embed.data.title}\`\n\n\`\`\`${error.message}\`\`\``, footer: { text: "If this error persists, please contact the bot developer" } })], ephemeral: true });
            }
        }
    }
})

export default command;