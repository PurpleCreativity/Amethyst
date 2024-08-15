import { ButtonStyle, SlashCommandStringOption } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";

const command = new SlashCommand({
    name: "getpoints",
    description: "Get a user's points",

    customPermissions: ["PointsViewer"],
    module: "Points",

    options: [
        new SlashCommandStringOption()
            .setName("user")
            .setDescription("The username or id of the user")
            .setRequired(true)
    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const user = interaction.options.getString("user", true);
        const robloxUser = await client.Functions.GetRobloxUser(user);
        if (!robloxUser) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Set Points", description: "User not found" })], ephemeral: true });

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);
        const guildUser = await guildDataProfile.getUser(robloxUser.id);
        const pendingPoints = await guildDataProfile.calculateUserPendingPoints(robloxUser.id);

        const embed = client.Functions.makeInfoEmbed({
            title: "User Data",
            footer: { text: robloxUser.name, iconURL: await robloxUser.fetchUserHeadshotUrl() },
            fields: [
                { name: "Points", value: `${guildUser.points} ${pendingPoints !== 0 ? `(${pendingPoints} pending)` : ""}`, inline: true },
            ],
        })

        const buttonEmbed = new ButtonEmbed(embed);

        buttonEmbed.addButton({
            label: "Full Data",
            style: ButtonStyle.Secondary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const robloxGroup = await guildDataProfile.fetchGroup();
                const role = await robloxGroup?.fetchRoleByRank(guildUser.ranklock.rank);

                buttoninteraction.reply({
                    embeds: [
                        client.Functions.makeInfoEmbed({
                            title: "Full User Data",
                            footer: { text: robloxUser.name, iconURL: await robloxUser.fetchUserHeadshotUrl() },
                            fields: [
                                { name: "Points", value: `${guildUser.points} ${pendingPoints !== 0 ? `(${pendingPoints} pending)` : ""}`, inline: false },
                                { name: "Notes", value: `${guildUser.note.text !== "" ? `Visible: \`${guildUser.note.visible}\`\n Note: ${guildUser.note.text}` : "No notes"}`, inline: false },
                                { name: "Ranklock", value: `${robloxGroup && guildUser.ranklock.rank !== 0 ? `Ranklocked to \`${role?.name}\`:\`${role?.rank}\`\nShadow: \`${guildUser.ranklock.shadow}\`\nReason: ${guildUser.ranklock.reason !== "" ? guildUser.ranklock.reason : "No reason"}` : "No ranklock data"}`, inline: false },
                            ]
                        })
                    ], ephemeral: true
                })
            }
        })

        return interaction.reply(buttonEmbed.getMessageData());
    }
})

export default command;