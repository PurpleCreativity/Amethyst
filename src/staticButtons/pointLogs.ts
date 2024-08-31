import Icons from "../assets/Icons.js";
import StaticButton from "../classes/StaticButton.js";
import client from "../index.js";

export default new StaticButton({
    customId: "pointlog",
    permissions: [],
    customPermissions: ["PointsManager"],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);
        if (!guildDataProfile) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Guild unregistered", description: "This guild is not registered in the database", footer: { text: "Contact the bot developer to register your guild" } })] });

        const args = interaction.customId.split("_"); args.shift(); args.shift();
        const pointLog = await guildDataProfile.getPointLog(args[0]);
        if (!pointLog) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Point Log", description: "Point log not found" })], ephemeral: true });
        const method: "viewdata" | "delete" | "import" = args[1].toLowerCase() as "viewdata" | "delete" | "import";

        switch (method) {
            case "viewdata": {
                const pointsMap: { [key: number]: string[] } = {};
    
                for (const user of pointLog.data) {
                    if (!pointsMap[user.points]) {
                        pointsMap[user.points] = [];
                    }
                    pointsMap[user.points].push(user.username);
                }

                const userText = Object.entries(pointsMap)
                    .map(([points, usernames]) => `${points} - ${usernames.map(username => `${username}`).join(', ')}`)
                    .join('\n');

                const userBuffer = Buffer.from(userText, 'utf-8');

                return interaction.reply({ files: [{ name: `pointlog_${pointLog.id}_fulldata.txt`, attachment: userBuffer }], ephemeral: true });
            }

            case "delete": {
                await guildDataProfile.deletePointLog(pointLog.id);
                const baseEmbed = client.Functions.makePointlogEmbed(pointLog);
                baseEmbed.setColor(0xff0000);
                baseEmbed.setAuthor({ name: "Deleted", iconURL: Icons.close });
                baseEmbed.setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });
                baseEmbed.setTimestamp();

                return interaction.message.edit({ embeds: [baseEmbed], components: [] });
            }

            case "import": {
                await guildDataProfile.importPointLog(pointLog.id);
                const baseEmbed = client.Functions.makePointlogEmbed(pointLog);
                baseEmbed.setColor(0x00ff00);
                baseEmbed.setAuthor({ name: "Imported", iconURL: Icons.check });
                baseEmbed.setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });
                baseEmbed.setTimestamp();

                return interaction.message.edit({ embeds: [baseEmbed], components: [] });
            }
        }
    }
})