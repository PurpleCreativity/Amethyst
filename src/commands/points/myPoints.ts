import type { ChatInputCommandInteraction } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import type { guildProfileInterface } from "../../schemas/guildProfile.js";

const _function = async (interaction: ChatInputCommandInteraction, guildDataProfile: guildProfileInterface | undefined) => {
    if (!interaction.guild || !guildDataProfile) return;

    const robloxUser = await client.Functions.GetLinkedRobloxUser(interaction.user.id);
    if (!robloxUser) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Your Points", description: "You are not linked to a Roblox account" })] });

    const guildUser = await guildDataProfile.getUser(robloxUser.id);
    const guildPendingPoints = await guildDataProfile.calculateUserPendingPoints(robloxUser.id);
    
    const embed = client.Functions.makeInfoEmbed({
        title: "Your Points",
        footer: { text: robloxUser.name, iconURL: await robloxUser.fetchUserHeadshotUrl() }, 
    });

    embed.addFields({ name: guildDataProfile.guild.shortname, value: `${guildUser.points} points ${guildPendingPoints !== 0 ? `(${guildPendingPoints} pending)` : ""}\n${guildUser.ranklock.rank !== 0 && !guildUser.ranklock.shadow ? "**Ranklocked**" : ""}`, inline: true })

    for (const linkedGuild of guildDataProfile.linkedGuilds.keys()) {
        const linkedGuildData = await client.Database.GetGuildProfile(linkedGuild);
        if (!linkedGuildData) continue;

        const linkedGuildUser = await linkedGuildData.getUser(robloxUser.id);

        const pendingPoints = await linkedGuildData.calculateUserPendingPoints(robloxUser.id);

        embed.addFields({ name: linkedGuildData.guild.shortname, value: `${linkedGuildUser.points} points ${pendingPoints !== 0 ? `(${pendingPoints} pending)` : ""}\n${linkedGuildUser.ranklock.rank !== 0 && !linkedGuildUser.ranklock.shadow ? "**Ranklocked**" : ""}`, inline: true });
    }

    interaction.editReply({ embeds: [embed] });
}

const full = new SlashCommand({
    name: "mypoints",
    description: "Shows your points",

    defer: true,
    module: "Points",

    userCooldown: 10000,

    execute: async (interaction, guildDataProfile) => {
        return _function(interaction, guildDataProfile)
    }
});

const shortname = new SlashCommand({
    name: "mp",
    description: "Shows your points",

    defer: true,
    module: "Points",

    userCooldown: 10000,

    execute: async (interaction, guildDataProfile) => {
        return _function(interaction, guildDataProfile)
    }
});

export default [full, shortname];