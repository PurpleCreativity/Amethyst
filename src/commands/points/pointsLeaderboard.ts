import PageEmbed from "../../classes/PageEmbed.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";

export default new SlashCommand({
    name: "pointsleaderboard",
    description: "View the points leaderboard",

    defer: true,
    guildCooldown: 60000,
    customPermissions: ["PointsViewer"],

    execute: async (interaction, guildDataProfile) => {
        if (!interaction.guild || !guildDataProfile) return;

        const infoEmbed = client.Functions.makeInfoEmbed({ title: "Points leaderboard", description: `Points leaderboard for \`${guildDataProfile.guild.shortname}\`` });
        const users = Array.from(guildDataProfile.users.values()).sort((a, b) => b.points - a.points);

        const fields = users.map((user, index) => {
            return {
                name: `${index + 1}. ${user.roblox.username}`,
                value: `${user.points} points`,
                inline: false
            }
        });

        const pageEmbed = new PageEmbed({ allowedUsers: [interaction.user.id], baseEmbed: infoEmbed, fieldsPerPage: 10, fields: fields, PageFooter: true });

        interaction.editReply(pageEmbed.getMessageData());
    }
})