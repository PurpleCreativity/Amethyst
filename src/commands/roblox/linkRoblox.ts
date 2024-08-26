import { type ButtonInteraction, ButtonStyle, type ChatInputCommandInteraction, type StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import StringSelector from "../../classes/StringSelector.js";
import Emojis from "../../assets/Emojis.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import { AxiosError } from "axios";

const linkRoblox = async (method: "OAuth 2.0" | "RoVer" | "BloxLink", interaction: ButtonInteraction | ChatInputCommandInteraction) => {
    const userDataProfile = await client.Database.GetUserProfile(interaction.user.id);

    if (method === "RoVer" || method === "BloxLink") {
        if (!interaction.guild) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({title: "Account Link", description: "This method is only available in guilds"})], components: [] });
        await interaction.editReply({ content: `${Emojis.thinking}  Processing...`, embeds: [], components: [] });
        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);

        if (method === "RoVer") {
            if (!guildDataProfile.roblox.rover_Key) return interaction.editReply({ content: null, embeds: [client.Functions.makeErrorEmbed({ title: "Account Link", description: "This server doesn't have a RoVer key set" })], components: [] });

            try {
                const roVerrequest = await client.Axios.get(`https://registry.rover.link/api/guilds/${interaction.guild.id}/discord-to-roblox/${interaction.user.id}`, { headers: { "Authorization": `Bearer ${client.Functions.Decrypt(guildDataProfile.roblox.rover_Key, guildDataProfile.iv)}` } });
                if (roVerrequest.status !== 200) return interaction.editReply({ content: null, embeds: [client.Functions.makeErrorEmbed({ title: "Account Link", description: "Failed to link your account" })], components: [] });

                const robloxUser = await client.WrapBlox.fetchUser(roVerrequest.data.robloxId)
                if (!robloxUser) return interaction.editReply({ content: null, embeds: [client.Functions.makeErrorEmbed({ title: "Account Link", description: "Failed to link your account" })], components: [] });

                await userDataProfile.linkRoblox(robloxUser);

                return interaction.editReply({ content: null, embeds: [
                    client.Functions.makeSuccessEmbed({
                        title: "Account Link",
                        description: `Your account has been successfully linked to \`${robloxUser.name}\`:\`${robloxUser.id}\``,
                        thumbnail: await robloxUser.fetchUserHeadshotUrl(),
                        footer: { text: "Verified via RoVer", iconURL: "https://cdn.discordapp.com/avatars/298796807323123712/7338ed45666cd90ec1a6662491a9eb8a.png" }
                    })
                ], components: [] });
            } catch (error) {
                if (!(error instanceof AxiosError)) return;

                interaction.editReply({ content: null, embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "An error occured",
                        description: `${error.response?.status}: ${error.response?.statusText}`,

                        footer: { text: "Please try again later, and contact a server admin if this persists." }
                    })
                ], components: [] })
            }
            return;
        }

        if (method === "BloxLink") {
            if (!guildDataProfile.roblox.bloxlink_Key) return interaction.editReply({ content: null, embeds: [client.Functions.makeErrorEmbed({ title: "Account Link", description: "This server doesn't have a BloxLink key set" })], components: [] });

            try {
                const bloxLinkRequest = await client.Axios.get(`https://api.blox.link/v4/public/guilds/${interaction.guild.id}/discord-to-roblox/${interaction.user.id}`, { headers: { "Authorization": client.Functions.Decrypt(guildDataProfile.roblox.bloxlink_Key, guildDataProfile.iv) } })
                if (bloxLinkRequest.status !== 200) return interaction.editReply({ content: null, embeds: [client.Functions.makeErrorEmbed({ title: "Account Link", description: "Failed to link your account" })], components: [] });

                const robloxUser = await client.WrapBlox.fetchUser(bloxLinkRequest.data.robloxID)
                if (!robloxUser) return interaction.editReply({ content: null, embeds: [client.Functions.makeErrorEmbed({ title: "Account Link", description: "Failed to link your account" })], components: [] });

                await userDataProfile.linkRoblox(robloxUser);

                return interaction.editReply({ content: null, embeds: [
                    client.Functions.makeSuccessEmbed({
                        title: "Account Link",
                        description: `Your account has been successfully linked to \`${robloxUser.name}\`:\`${robloxUser.id}\``,
                        thumbnail: await robloxUser.fetchUserHeadshotUrl(),
                        footer: { text: "Verified with BloxLink", iconURL: "https://cdn.discordapp.com/avatars/426537812993638400/746124a5a40305b92d6dc4e983fd1de2.png" }
                    })
                ], components: [] });
            } catch (error) {
                if (!(error instanceof AxiosError)) return;

                interaction.editReply({ content: null, embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "An error occured",
                        description: `${error.response?.status}: ${error.response?.statusText}`,

                        footer: { text: "Please try again later, and contact a server admin if this persists." }
                    })
                ], components: [] })
            }
        }

        return;
    }

    switch (method) {
        case "OAuth 2.0": {
            return interaction.editReply({
                embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "OAuth 2.0",
                        description: "This method is still in development, please use a diffrent method."
                    })
                ], components: []
            })
        }
    }
}

export default new SlashCommand({
    name: "linkroblox",
    description: "Link your Roblox account to your Discord account",

    userApp: true,
    userCooldown: 30000,

    execute: async (interaction) => {
        const options = [
            new StringSelectMenuOptionBuilder().setLabel("OAuth 2.0").setValue("OAuth 2.0").setDescription("Utilizes roblox's OAuth 2.0 apps.").setEmoji(Emojis.roblox),
        ]

        if (interaction.guild) {
            const bloxLinkMember = await client.Functions.pcall(async () => await interaction.guild?.members.fetch("426537812993638400"));
            const roVerMember = await client.Functions.pcall(async () => await interaction.guild?.members.fetch("298796807323123712"))

            if (roVerMember[0]) options.push(new StringSelectMenuOptionBuilder().setLabel("RoVer").setValue("RoVer").setDescription("Assuming you are verified with RoVer, this is a 1 click action.").setEmoji(Emojis.rover));
            if (bloxLinkMember[0]) options.push(new StringSelectMenuOptionBuilder().setLabel("BloxLink").setValue("BloxLink").setDescription("Assuming you are verified with BloxLink, this is a 1 click action.").setEmoji(Emojis.bloxlink));
        }

        const selector = new StringSelector({ Placeholder: "Select a linking method", Options: options, MaxValues: 1, MinValues: 1 });
        
        const response = await selector.Prompt(interaction, client.Functions.makeInfoEmbed({ title: "Account Link", description: "Please select a linking method" }));
        if (!response.values) return;

        await response.interaction.deferReply();
        await linkRoblox(response.values[0] as "OAuth 2.0" | "RoVer" | "BloxLink", response.interaction);
    }
})