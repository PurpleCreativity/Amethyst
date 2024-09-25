import { APIEmbed, APIEmbedField, ButtonStyle, SlashCommandStringOption } from "discord.js";
import SlashCommand from "../../classes/SlashCommand.js";
import client from "../../index.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import PageEmbed from "../../classes/PageEmbed.js";
import Emojis from "../../assets/Emojis.js";

type RobloxFriend = { isOnline: boolean; isDeleted: boolean; friendFrequentScore: number; friendFrequentRank: number; hasVerifiedBadge: boolean; description: string | undefined; created: string; isBanned: boolean; externalAppDisplayName: string; id: number, name: string, displayName: string }
type RobloxFollower = { isDeleted: boolean; friendFrequentScore: number; friendFrequentRank: number; hasVerifiedBadge: boolean; description: string | undefined; created: string; isBanned: boolean; externalAppDisplayName: string; id: number, name: string, displayName: string }
const maxSearchReturn = 1000;

export default new SlashCommand({
    name: "robloxprofile",
    description: "Render a Roblox profile",

    defer: true,
    userApp: true,
    options: [
        new SlashCommandStringOption()
            .setName("user")
            .setDescription("The username or id of the Roblox user")
            .setRequired(true)
    ],

    execute: async (interaction) => {
        const user = interaction.options.getString("user", true);

        const actualUser = await client.Functions.GetRobloxUser(user);
        if (!actualUser) return interaction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "User not found", description: "Failed to get Roblox user" })] });

        const friendCount = await actualUser.fetchFriendCount()
        const followCount = (await client.WrapBlox.fetchHandler.fetch("GET", "Friends", `/users/${actualUser.id}/followers/count`)).count
        const followingCount = (await client.WrapBlox.fetchHandler.fetch("GET", "Friends", `/users/${actualUser.id}/followings/count`)).count

        const buttonEmbed = new ButtonEmbed(client.Functions.makeInfoEmbed({
            title: actualUser.name,
            url: `https://www.roblox.com/users/${actualUser.id}/profile`,

            description: actualUser.description.slice(0, 2048),

            thumbnail: await actualUser.fetchUserHeadshotUrl(),
            image: await actualUser.fetchUserAvatarThumbnailUrl(),

            fields: [
                { name: "Username", value: `\`${actualUser.name}\``, inline: true },
                { name: "Display name", value: `\`${actualUser.displayName}\``, inline: true },
                { name: "Id", value: `\`${actualUser.id}\``, inline: true },

                { name: "Friends", value: `\`${friendCount}\``, inline: true},
                { name: "Followers", value: `\`${followCount}\``, inline: true },
                { name: "Following", value: `\`${followingCount}\``, inline: true },

                { name: "Banned", value: `\`${actualUser.rawData.isBanned}\``, inline: true },
                { name: "Account age", value: `\`${Math.ceil(Math.abs(new Date().getTime() - new Date(actualUser.rawData.created).getTime()) / (1000 * 3600 * 24))}\` days`, inline: true },
                { name: "Join date", value: `<t:${Math.round(new Date(actualUser.rawData.created).getTime() / 1000)}:F>`, inline: true },

                { name: "Public Inventory", value: `${await actualUser.canViewInventory() ? "Yes" : "No"}`, inline: true },
            ]
        }))

        const viewFriends = buttonEmbed.addButton({
            label: `View Friends [${friendCount}]`,
            style: ButtonStyle.Secondary,
            allowedUsers: [interaction.user.id],
            function: async (buttonInteraction) => {
                await buttonInteraction.deferReply();

                try {
                    const users = await client.WrapBlox.fetchHandler.fetch("GET", "Friends", `/users/${actualUser.id}/friends?limit=100`)
                    const fields = [] as APIEmbedField[];

                    for (const friend of users.data) {
                        fields.push({
                            name: `${friend.hasVerifiedBadge ? `${Emojis.roblox_verified} ` : ""}${friend.name}:\`${friend.id}\``,
                            value: `[Profile](https://www.roblox.com/users/${friend.id}/profile)`,
                            inline: true
                        })
                    }

                    let nextPageToken = users.nextPageCursor
                    while (nextPageToken) {
                        const nextPage = await client.WrapBlox.fetchHandler.fetch("GET", "Friends", `/users/${actualUser.id}/friends?limit=100&cursor=${nextPageToken}`)
                        for (const friend of nextPage.data) {
                            fields.push({
                                name: `${friend.hasVerifiedBadge ? `${Emojis.roblox_verified} ` : ""}${friend.name}:\`${friend.id}\``,
                                value: `[Profile](https://www.roblox.com/users/${friend.id}/profile)`,
                                inline: true
                            })
                        }

                        nextPageToken = nextPage.nextPageCursor
                    }

                    const pageEmbed = new PageEmbed({ fields: fields, fieldsPerPage: 24, allowedUsers: [interaction.user.id], PageFooter: true, baseEmbed: client.Functions.makeInfoEmbed({ title: "Friend list", description: `Friend list for \`${actualUser.name}\` (${friendCount})` }) })
                    buttonInteraction.editReply(pageEmbed.getMessageData());
                } catch (error) {
                    buttonInteraction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Failed to get friends", description: "Failed to get user friends" })] });
                }
            }
        })

        const viewFollowers = buttonEmbed.addButton({
            label: `View Followers [${followCount}]`,
            style: ButtonStyle.Secondary,
            allowedUsers: [interaction.user.id],
            function: async (buttonInteraction) => {
                await buttonInteraction.deferReply();

                try {
                    const users = await client.WrapBlox.fetchHandler.fetch("GET", "Friends", `/users/${actualUser.id}/followers?limit=100`)
                    const fields = [] as APIEmbedField[];

                    for (const follower of users.data) {
                        fields.push({
                            name: `${follower.hasVerifiedBadge ? `${Emojis.roblox_verified} ` : ""}${follower.name}:\`${follower.id}\``,
                            value: `[Profile](https://www.roblox.com/users/${follower.id}/profile)`,
                            inline: true
                        })
                    }

                    let nextPageToken = users.nextPageCursor
                    while (nextPageToken) {
                        if (fields.length >= maxSearchReturn) break;

                        const nextPage = await client.WrapBlox.fetchHandler.fetch("GET", "Friends", `/users/${actualUser.id}/followers?limit=100&cursor=${nextPageToken}`)
                        for (const follower of nextPage.data) {
                            fields.push({
                                name: `${follower.hasVerifiedBadge ? `${Emojis.roblox_verified} ` : ""}${follower.name}:\`${follower.id}\``,
                                value: `[Profile](https://www.roblox.com/users/${follower.id}/profile)`,
                                inline: true
                            })
                        }

                        nextPageToken = nextPage.nextPageCursor
                    }

                    const pageEmbed = new PageEmbed({ fields: fields, fieldsPerPage: 24, allowedUsers: [interaction.user.id], PageFooter: true, baseEmbed: client.Functions.makeInfoEmbed({ title: "Follower list", description: `Follower list for \`${actualUser.name}\` (${followCount})\n**${Emojis.warning} Only showing up to 1000 results!**` }) })
                    buttonInteraction.editReply(pageEmbed.getMessageData());
                } catch (error) {
                    console.log(error)
                    buttonInteraction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Failed to get followers", description: "Failed to get user followers" })] });
                }
            }
        })

        const viewFollowing = buttonEmbed.addButton({
            label: `View Following [${followingCount}]`,
            style: ButtonStyle.Secondary,
            allowedUsers: [interaction.user.id],
            function: async (buttonInteraction) => {
                await buttonInteraction.deferReply();

                try {
                    const users = await client.WrapBlox.fetchHandler.fetch("GET", "Friends", `/users/${actualUser.id}/followings?limit=100`)
                    const fields = [] as APIEmbedField[];

                    for (const following of users.data) {
                        fields.push({
                            name: `${following.hasVerifiedBadge ? `${Emojis.roblox_verified} ` : ""}${following.name}:\`${following.id}\``,
                            value: `[Profile](https://www.roblox.com/users/${following.id}/profile)`,
                            inline: true
                        })
                    }

                    let nextPageToken = users.nextPageCursor
                    while (nextPageToken) {
                        if (fields.length >= maxSearchReturn) break;

                        const nextPage = await client.WrapBlox.fetchHandler.fetch("GET", "Friends", `/users/${actualUser.id}/followings?limit=100&cursor=${nextPageToken}`)
                        for (const following of nextPage.data) {
                            fields.push({
                                name: `${following.hasVerifiedBadge ? `${Emojis.roblox_verified} ` : ""}${following.name}:\`${following.id}\``,
                                value: `[Profile](https://www.roblox.com/users/${following.id}/profile)`,
                                inline: true
                            })
                        }

                        nextPageToken = nextPage.nextPageCursor
                    }

                    const pageEmbed = new PageEmbed({ fields: fields, fieldsPerPage: 24, allowedUsers: [interaction.user.id], PageFooter: true, baseEmbed: client.Functions.makeInfoEmbed({ title: "Following list", description: `Following list for \`${actualUser.name}\` (${followingCount})\n**${Emojis.warning} Only showing up to 1000 results!**` }) })
                    buttonInteraction.editReply(pageEmbed.getMessageData());
                } catch (error) {
                    buttonInteraction.editReply({ embeds: [client.Functions.makeErrorEmbed({ title: "Failed to get following", description: "Failed to get user following" })] });
                }
            }
        })

        if (friendCount === 0) buttonEmbed.disableButton(viewFriends);
        if (followCount === 0) buttonEmbed.disableButton(viewFollowers);
        if (followingCount === 0) buttonEmbed.disableButton(viewFollowing);

        interaction.editReply(buttonEmbed.getMessageData());
    }
})