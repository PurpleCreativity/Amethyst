import { ButtonStyle, type ModalSubmitInteraction, SlashCommandSubcommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import type { guildProfileInterface, RobloxPlace } from "../../schemas/guildProfile.js";
import Modal from "../../classes/Modal.js";
import { AxiosError } from "axios";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import Emojis from "../../assets/Emojis.js";

const DurationToSeconds = (durations: string) => {
    const durationRegex = /(\d+)([yMwdhms])/g;
    const durationMap = {
        y: 31536000, // 1 year = 365 days * 24 hours * 60 minutes * 60 seconds
        M: 2592000, // 1 month = 30 days * 24 hours * 60 minutes * 60 seconds
        w: 604800, // 1 week = 7 days * 24 hours * 60 minutes * 60 seconds
        d: 86400, // 1 day = 24 hours * 60 minutes * 60 seconds
        h: 3600, // 1 hour = 60 minutes * 60 seconds
        m: 60, // 1 minute = 60 seconds
        s: 1 // 1 second
    } as Record<string, number>;

    let totalSeconds = 0;
    let match: any;
    
    // biome-ignore lint/suspicious/noAssignInExpressions: No idea how to write this in a diffrent way
    while (match = durationRegex.exec(durations)) {
        const [, amount, unit] = match;
        const seconds = Number.parseInt(amount) * durationMap[unit];
        totalSeconds += seconds;
    }

    return totalSeconds;
};

const checkBan = async (guildDataProfile: guildProfileInterface, place: RobloxPlace, userId: number) => {
    const universeId = await client.Functions.ConvertPlaceIDToUniverseID(Number.parseInt(place.id))
    const placeKey = client.Functions.Decrypt(place.key, guildDataProfile.iv);

    const request = await client.Axios.request({
        method: 'GET',
        url: `https://apis.roblox.com/cloud/v2/universes/${universeId}/user-restrictions/${userId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': placeKey
        },
    })

    return request
};

const placeBan = async (guildDataProfile: guildProfileInterface, place: RobloxPlace, userId: number, banActive: boolean, displayReason?: string, privateReason?: string, duration?: number, excludeAltAccounts?: boolean, inherited?: boolean) => {
    duration = duration || 0;
    excludeAltAccounts = excludeAltAccounts || false;
    inherited = inherited || true;

    const universeId = await client.Functions.ConvertPlaceIDToUniverseID(Number.parseInt(place.id))
    const placeKey = client.Functions.Decrypt(place.key, guildDataProfile.iv);

    let data = {};

    if (banActive !== true) {
        data = {
            gameJoinRestriction: {
                active: false,
            }
        }
    } else if (duration === 0) {
        data = {
            gameJoinRestriction: {
                active: true,
                privateReason: privateReason,
                displayReason: displayReason,
                excludeAltAccounts: excludeAltAccounts,
                inherited: inherited
            }
        }
    } else {
        data = {
            gameJoinRestriction: {
                active: true,
                duration: `${duration}s`,
                privateReason: privateReason,
                displayReason: displayReason,
                excludeAltAccounts: excludeAltAccounts,
                inherited: inherited
            }
        }
    }

    const request = await client.Axios.request({
        method: 'PATCH',
        url: `https://apis.roblox.com/cloud/v2/universes/${universeId}/user-restrictions/${userId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': placeKey
        },
        data: data
    })

    return request
};

export default new SlashCommand({
    name: "place",
    description: "Actions to perform on Roblox game places",

    defer: false,
    customPermissions: ["RobloxModerator"],
    subcommands: [
        new SlashCommandSubcommandBuilder()
            .setName("add")
            .setDescription("Add a place to the database")
        ,

        new SlashCommandSubcommandBuilder()
            .setName("remove")
            .setDescription("Remove a place from the database")
            .addStringOption(option => option.setName("place").setDescription("The place to remove").setRequired(true).setAutocomplete(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("list")
            .setDescription("List all places in the database")
        ,

        new SlashCommandSubcommandBuilder()
            .setName("ban")
            .setDescription("Ban a user from a place")
            .addStringOption(option => option.setName("place").setDescription("The place to ban the user from").setAutocomplete(true).setRequired(true))
            .addStringOption(option => option.setName("username").setDescription("The user to ban").setRequired(true))
            .addStringOption(option => option.setName("display-reason").setDescription("Reason shown to the user on join").setMaxLength(400).setRequired(true))
            .addStringOption(option => option.setName("private-reason").setDescription("Private reason for the ban").setMaxLength(300).setRequired(true))
            .addStringOption(option => option.setName("duration").setDescription("Duration of the ban (e.g. 1d, 1h, 1m, 1s, 1y, inf, perm)").setRequired(true))
            .addBooleanOption(option => option.setName("exclude-alt-accounts").setDescription("Exclude alt accounts from the ban").setRequired(false))
            .addBooleanOption(option => option.setName("inherited").setDescription("Whether to inherit the ban from the parent universe or not").setRequired(false))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("globalban")
            .setDescription("Ban a user from all places")
            .addStringOption(option => option.setName("username").setDescription("The user to ban").setRequired(true))
            .addStringOption(option => option.setName("display-reason").setDescription("Reason shown to the user on join").setMaxLength(400).setRequired(true))
            .addStringOption(option => option.setName("private-reason").setDescription("Private reason for the ban").setMaxLength(300).setRequired(true))
            .addStringOption(option => option.setName("duration").setDescription("Duration of the ban (e.g. 1d, 1h, 1m, 1s, 1y, inf, perm)").setRequired(true))
            .addBooleanOption(option => option.setName("exclude-alt-accounts").setDescription("Exclude alt accounts from the ban").setRequired(false))
            .addBooleanOption(option => option.setName("inherited").setDescription("Whether to inherit the ban from the parent universe or not").setRequired(false))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("unban")
            .setDescription("Unban a user from a place")
            .addStringOption(option => option.setName("place").setDescription("The place to unban the user from").setAutocomplete(true).setRequired(true))
            .addStringOption(option => option.setName("username").setDescription("The user to unban").setRequired(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("globalunban")
            .setDescription("Unban a user from all places")
            .addStringOption(option => option.setName("username").setDescription("The user to unban").setRequired(true))

        ,

        new SlashCommandSubcommandBuilder()
            .setName("checkban")
            .setDescription("Check if a user is banned from a place")
            .addStringOption(option => option.setName("place").setDescription("The place to check the ban for").setAutocomplete(true).setRequired(true))
            .addStringOption(option => option.setName("username").setDescription("The user to check the ban for").setRequired(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("globalcheckban")
            .setDescription("Check if a user is banned from all places")
            .addStringOption(option => option.setName("username").setDescription("The user to check the ban for").setRequired(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("servers")
            .setDescription("Returns a list of active game servers")
            .addStringOption(option => option.setName("place").setDescription("The place in which the server is").setAutocomplete(true).setRequired(true))
            .addStringOption(option => option.setName("sorting-order").setDescription("The server to manage").addChoices([
                { name: "Ascending", value: "asc" },
                { name: "Descending", value: "des" }
            ]).setRequired(true))
            .addNumberOption(option => option.setName("limit").setDescription("The amount of servers to return").addChoices([
                { name: "10", value: 10 },
                { name: "25", value: 25 },
                { name: "50", value: 50 },
                { name: "100", value: 100 },
            ]).setRequired(false))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("getlogs")
            .setDescription("Returns a server's astralogs")
            .addStringOption(option => option.setName("place").setDescription("The place in which the server is").setAutocomplete(true).setRequired(true))
            .addStringOption(option => option.setName("server-id").setDescription("The server to get the logs for").setAutocomplete(true).setRequired(true))
        ,
    ],

    execute: async (interaction, guildDataProfile) => {
        if (!interaction.guild || !guildDataProfile) return;

        const subcommand = interaction.options.getSubcommand(true);
        if (subcommand !== "add") await interaction.deferReply();

        switch (subcommand) {
            case "add": {
                if (guildDataProfile.roblox.places.size >= 25) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Max places reached", description: "You can only have up to \`25\` places per guild" })] });

                const modal = new Modal({
                    Title: "Add a place",
                    Inputs: [
                        new TextInputBuilder()
                            .setCustomId("name")
                            .setLabel("Place Name")
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(10)
                            .setRequired(true)
                        ,

                        new TextInputBuilder()
                            .setCustomId("id")
                            .setLabel("Place Id")
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(20)
                            .setRequired(true)
                        ,

                        new TextInputBuilder()
                            .setCustomId("key")
                            .setLabel("Place API Key")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(false)
                        ,
                    ]
                });
                    
                const response = await modal.Prompt(interaction) as ModalSubmitInteraction;
                await response.deferReply();

                const placeName = response.fields.getTextInputValue("name");
                const placeId = response.fields.getTextInputValue("id");
                const placeKey = response.fields.getTextInputValue("key") ? client.Functions.Encypt(response.fields.getTextInputValue("key"), guildDataProfile.iv) : undefined;

                const actualPlace = await client.WrapBlox.fetchGame(await client.Functions.ConvertPlaceIDToUniverseID(Number.parseInt(placeId)));
                if (!actualPlace) return response.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Invalid place", description: "The place you provided is invalid" })] });

                guildDataProfile.roblox.places.set(placeName, { name: placeName, id: placeId, key: placeKey ? placeKey : "" });
                await guildDataProfile.save();

                return response.editReply({ embeds: [client.Functions.makeInfoEmbed({ title: "Place added", description: `The \`${placeName}\` place has been added to the database` })] });
            }

            case "remove": {
                const placeName = interaction.options.getString("place", true);
                if (!guildDataProfile.roblox.places.has(placeName)) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Invalid place", description: "The place you provided is invalid" })] });

                guildDataProfile.roblox.places.delete(placeName);
                await guildDataProfile.save();

                return interaction.editReply({ embeds: [client.Functions.makeInfoEmbed({ title: "Place removed", description: `The \`${placeName}\` place has been removed from the database` })] });
            }

            case "list": {
                if (guildDataProfile.roblox.places.size === 0) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "No places", description: "There are no places in the database" })] });

                const places = [] as string[];

                for (const place of guildDataProfile.roblox.places.values()) {
                    places.push(`[${place.name}:${place.id}](https://www.roblox.com/games/${place.id})`);
                }

                return interaction.editReply({ embeds: [client.Functions.makeInfoEmbed({ title: "Places in the database", description: places.join("\n") })] });
            }

            case "ban": {
                const placeName = interaction.options.getString("place", true);
                const username = interaction.options.getString("username", true);
                const displayReason = interaction.options.getString("display-reason", true);
                const privateReason = `${interaction.options.getString("private-reason", true)}\nModerator: ${interaction.user.username}\nBanned via Amethyst`;
                const duration = DurationToSeconds(interaction.options.getString("duration", true));
                const excludeAltAccounts = interaction.options.getBoolean("exclude-alt-accounts", false) || false;
                const inherited = interaction.options.getBoolean("inherited", false) || true;

                if (!guildDataProfile.roblox.places.has(placeName)) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Invalid place", description: "The place you provided is invalid" })] });
                const place = guildDataProfile.roblox.places.get(placeName);
                if (!place?.key || place.key === "") return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Invalid place key", description: "The place key is missing" })] });

                const actualUser = await client.Functions.GetRobloxUser(username);
                if (!actualUser) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Invalid user", description: "The user you provided is invalid" })] });

                //await placeBan(guildDataProfile, place, actualUser.id, false);

                try {
                    const existingBan = await checkBan(guildDataProfile, place, actualUser.id);

                    if (existingBan.data.gameJoinRestriction.active) {
                        const banDuration = existingBan.data.gameJoinRestriction.duration ? Number.parseInt(existingBan.data.gameJoinRestriction.duration.slice(0, -1)) : 0;
                        const bannedOn = Math.floor(new Date(existingBan.data.gameJoinRestriction.startTime).getTime() / 1000);
                        const expiresOn = (banDuration && banDuration !== 0) ? Math.floor(bannedOn + banDuration) : 0;

                        const buttonEmbed = new ButtonEmbed(
                            client.Functions.makeWarnEmbed({
                                title: "User already banned",
                                description: `[${actualUser.name}](https://www.roblox.com/users/${actualUser.id}/profile) is already banned from the \`${placeName}\` place`,

                                fields: [
                                    { name: "Banned", value: `<t:${bannedOn}:F>\n<t:${bannedOn}:R>`, inline: true },
                                    { name: "Expires", value: banDuration !== 0 ? `<t:${expiresOn}:F>\n<t:${expiresOn}:R>` : "\`(Permanent)\`", inline: true },
                                    { name: "Display Reason", value: `\`${existingBan.data.gameJoinRestriction.displayReason}\``, inline: false },
                                    { name: "Private Reason", value: `\`${existingBan.data.gameJoinRestriction.privateReason}\``, inline: false },
                                    { name: "Excludes Alt Accounts", value: `\`${existingBan.data.gameJoinRestriction.excludeAltAccounts}\``, inline: true },
                                    { name: "Inherited", value: `\`${existingBan.data.gameJoinRestriction.inherited}\``, inline: true },
                                ]
                            }),
                        );

                        buttonEmbed.addButton({
                            label: "Overwrite",
                            style: ButtonStyle.Success,
                            emoji: Emojis.import,
                            allowedUsers: [interaction.user.id],

                            function: async (buttonInteraction) => {
                                await buttonInteraction.deferUpdate();

                                const ban = await placeBan(guildDataProfile, place, actualUser.id, true, displayReason, privateReason, duration, excludeAltAccounts, inherited);
                                if (ban.status !== 200) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Request Error", description: ban.data.error || ban.statusText })] });

                                const banDuration = ban.data.gameJoinRestriction.duration ? Number.parseInt(ban.data.gameJoinRestriction.duration.slice(0, -1)) : 0;
                                const bannedOn = Math.floor(new Date(ban.data.gameJoinRestriction.startTime).getTime() / 1000);
                                const expiresOn = (banDuration && banDuration !== 0) ? Math.floor(bannedOn + banDuration) : 0;

                                return interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({
                                    title: "User banned (Overwritten)",
                                    description: `[${actualUser.name}](https://www.roblox.com/users/${actualUser.id}/profile) has been banned from the \`${placeName}\` place`,

                                    fields: [
                                        { name: "Banned", value: `<t:${bannedOn}:F>\n<t:${bannedOn}:R>`, inline: true },
                                        { name: "Expires", value: duration !== 0 ? `<t:${expiresOn}:F>\n<t:${expiresOn}:R>` : "\`(Permanent)\`", inline: true },
                                        { name: "Display Reason", value: `\`${displayReason}\``, inline: false },
                                        { name: "Private Reason", value: `\`${privateReason}\``, inline: false },
                                        { name: "Excludes Alt Accounts", value: `\`${excludeAltAccounts}\``, inline: true },
                                        { name: "Inherited", value: `\`${inherited}\``, inline: true },
                                    ]
                                })], components: [] });
                            }
                        });

                        buttonEmbed.addButton({
                            label: "Cancel",
                            style: ButtonStyle.Danger,
                            emoji: Emojis.delete,
                            allowedUsers: [interaction.user.id],

                            function: async (buttonInteraction) => {
                                await buttonInteraction.deferUpdate();
                                interaction.editReply({ embeds: [client.Functions.makeInfoEmbed({ title: "Action cancelled", description: "The action has been cancelled" })], components: [] });
                            }
                        })

                        return interaction.editReply(buttonEmbed.getMessageData());
                    }

                    const ban = await placeBan(guildDataProfile, place, actualUser.id, true, displayReason, privateReason, duration, excludeAltAccounts, inherited);
                    if (ban.status !== 200) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Request Error", description: ban.data.error || ban.statusText })] });

                    const banDuration = ban.data.gameJoinRestriction.duration ? Number.parseInt(ban.data.gameJoinRestriction.duration.slice(0, -1)) : 0;
                    const bannedOn = Math.floor(new Date(ban.data.gameJoinRestriction.startTime).getTime() / 1000);
                    const expiresOn = (banDuration && banDuration !== 0) ? Math.floor(bannedOn + banDuration) : 0;

                    return interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({
                        title: "User banned",
                        description: `[${actualUser.name}](https://www.roblox.com/users/${actualUser.id}/profile) has been banned from the \`${placeName}\` place`,

                        fields: [
                            { name: "Banned", value: `<t:${bannedOn}:F>\n<t:${bannedOn}:R>`, inline: true },
                            { name: "Expires", value: duration !== 0 ? `<t:${expiresOn}:F>\n<t:${expiresOn}:R>` : "\`(Permanent)\`", inline: true },
                            { name: "Display Reason", value: `\`${displayReason}\``, inline: false },
                            { name: "Private Reason", value: `\`${privateReason}\``, inline: false },
                            { name: "Excludes Alt Accounts", value: `\`${excludeAltAccounts}\``, inline: true },
                            { name: "Inherited", value: `\`${inherited}\``, inline: true },
                        ]
                    })] });
                } catch (error) {
                   if (error instanceof AxiosError) {
                        return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Request Error", description: error.response?.data.error || error.message })] });
                   } 

                   if (error instanceof Error) {
                        return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Internal Error", description: error.message })] });
                   }
                }

            }   
        }
    },

    autocomplete: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);
        if (!guildDataProfile) return [];

        const currentOption = interaction.options.getFocused(true);

        switch (currentOption.name) {
            case "place": {
                const places = [] as object[];

                for (const place of guildDataProfile.roblox.places.values()) {
                    places.push({
                        name: place.name,
                        value: place.name
                    });
                }

                return places;
            }
        }
    }
})