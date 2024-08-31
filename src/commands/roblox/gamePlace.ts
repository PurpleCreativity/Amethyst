import { SlashCommandSubcommandBuilder } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import type { guildProfileInterface, RobloxPlace } from "../../schemas/guildProfile.js";

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

    defer: true,
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

        switch (subcommand) {
            case "add": {
                if (guildDataProfile.roblox.places.size >= 25) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Max places reached", description: "You can only have up to \`25\` places per guild" })] });

                
            }
        }
    },

    autocomplete: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);
        if (!guildDataProfile) return [];

        const currentOption = interaction.options.getFocused();

        switch (currentOption) {
            case "place": {
                const places = [] as object[];

                for (const place of guildDataProfile.roblox.places.values()) {
                    places.push({
                        name: place.name,
                        value: place.id
                    });
                }

                return places;
            }
        }
    }
})