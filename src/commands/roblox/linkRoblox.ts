import { type ButtonInteraction, ButtonStyle, type ChatInputCommandInteraction, type ModalSubmitInteraction, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import StringSelector from "../../classes/StringSelector.js";
import Emojis from "../../assets/Emojis.js";
import { AxiosError } from "axios";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import Modal from "../../classes/Modal.js";

const linkRoblox = async (method: "OAuth 2.0" | "RoVer" | "BloxLink" | "Profile Description", interaction: ButtonInteraction | ChatInputCommandInteraction) => {
    const userDataProfile = await client.Database.GetUserProfile(interaction.user.id);

    if (method === "RoVer" || method === "BloxLink") {
        await interaction.deferReply();

        if (!interaction.guild) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({title: "Account Link", description: "This method is only available in guilds"})], components: [] });
        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);

        if (method === "RoVer") {
            if (!guildDataProfile.roblox.rover_Key) return interaction.editReply({ content: null, embeds: [client.Functions.makeErrorEmbed({ title: "Account Link", description: "This server doesn't have a RoVer key set" })], components: [] });

            try {
                const roVerrequest = await client.Axios.get(`https://registry.rover.link/api/guilds/${interaction.guild.id}/discord-to-roblox/${interaction.user.id}`, { headers: { "Authorization": `Bearer ${client.Functions.Decrypt(guildDataProfile.roblox.rover_Key, guildDataProfile.iv)}` } });
                if (roVerrequest.status !== 200) return interaction.editReply({ content: null, embeds: [client.Functions.makeErrorEmbed({ title: "Account Link", description: "Failed to link your account" })], components: [] });

                const robloxUser = await client.Functions.GetRobloxUser(roVerrequest.data.robloxId);
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
                client.Logs.LogError(error as Error);
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

                const robloxUser = await client.Functions.GetRobloxUser(bloxLinkRequest.data.robloxID)
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

    if (method === "OAuth 2.0") {
        
    }

    if (method === "Profile Description") {
        let randomString = `amethyst link ${client.Functions.GenerateID()}`

        const modal = new Modal({
            Title: "Profile Description Verification",
            Inputs: [
                new TextInputBuilder().setLabel("Username or Id").setCustomId("user").setPlaceholder("Purple_Creativity").setStyle(TextInputStyle.Short).setRequired(true),
            ]
        })

        const response = await modal.Prompt(interaction) as ModalSubmitInteraction;
        response.deferReply();

        const robloxUser = await client.Functions.GetRobloxUser(response.fields.getTextInputValue("user"));
        if (!robloxUser) return response.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Account Link", description: "User not found" })] });

        const baseEmbed = client.Functions.makeInfoEmbed({ title: `Hello, \`${robloxUser.name}\``, description: `### Your account has not been linked just yet!\n\nPlease set your profile description to the following value: \`\`\`${randomString}\`\`\`` });
        const buttonEmbed = new ButtonEmbed(baseEmbed);

        buttonEmbed.addButton({
            label: "I have set my profile description",
            style: ButtonStyle.Success,
            emoji: Emojis.check,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                await buttonInteraction.deferReply();

                const userDescription = (await client.Functions.GetRobloxUser(robloxUser.id, false))?.description;

                if (
                    !userDescription ||
                    userDescription !== randomString
                ) return buttonInteraction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Account Link", description: "The given value was not found in your profile description" })] });

                const userDataProfile = await client.Database.GetUserProfile(buttonInteraction.user.id);
                await userDataProfile.linkRoblox(robloxUser);

                await response.deleteReply();
                await buttonInteraction.editReply({ embeds: [
                    client.Functions.makeSuccessEmbed({
                        title: "Account Link",
                        description: `Your account has been successfully linked to \`${robloxUser.name}\`:\`${robloxUser.id}\``,
                        thumbnail: await robloxUser.fetchUserHeadshotUrl(),
                        footer: { text: "Verified via Profile Description", iconURL: client.user?.displayAvatarURL() }
                    })
                ] });
            }
        })

        buttonEmbed.addButton({
            label: "The given value got filtered",
            style: ButtonStyle.Danger,
            emoji: Emojis.delete,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                await buttonInteraction.deferUpdate();

                randomString = `amethyst link ${client.Functions.GenerateID()}`
                buttonEmbed.Embed.setDescription(`### Your account has not been linked just yet!\n\nPlease set your profile description to the following value: \`\`\`${randomString}\`\`\``);
                response.editReply(buttonEmbed.getMessageData());
            }
        });

        response.editReply(buttonEmbed.getMessageData());
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
            options.push(new StringSelectMenuOptionBuilder().setLabel("Profile Description").setValue("Profile Description").setDescription("Utilizes you setting your profile description to a specific value.").setEmoji(Emojis.description))

            const bloxLinkMember = await client.Functions.pcall(async () => await interaction.guild?.members.fetch("426537812993638400"));
            const roVerMember = await client.Functions.pcall(async () => await interaction.guild?.members.fetch("298796807323123712"))

            if (roVerMember[0]) options.push(new StringSelectMenuOptionBuilder().setLabel("RoVer").setValue("RoVer").setDescription("Assuming you are verified with RoVer, this is a 1 click action.").setEmoji(Emojis.rover));
            if (bloxLinkMember[0]) options.push(new StringSelectMenuOptionBuilder().setLabel("BloxLink").setValue("BloxLink").setDescription("Assuming you are verified with BloxLink, this is a 1 click action.").setEmoji(Emojis.bloxlink));
        }

        const selector = new StringSelector({ Placeholder: "Select a linking method", Options: options, MaxValues: 1, MinValues: 1 });
        
        const response = await selector.Prompt(interaction, client.Functions.makeInfoEmbed({ title: "Account Link", description: "Please select a linking method" }));
        if (!response.values) return;

        await linkRoblox(response.values[0] as "OAuth 2.0" | "RoVer" | "BloxLink" | "Profile Description", response.interaction);
    }
})