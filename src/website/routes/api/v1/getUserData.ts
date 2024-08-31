import rateLimit from "express-rate-limit";
import Route from "../../../../classes/Route.js";
import client from "../../../../index.js";

export default new Route({
    method: "GET",
    path: "guild/data/users/:robloxId",

    public: false,
    permissions: ["ViewPoints"],

    rateLimit: rateLimit({
		windowMs: 1 * 60 * 1000,
		limit: 120,
		standardHeaders: 'draft-6',
		legacyHeaders: true,

		handler: (req, res) => {
			return client.API.rateLimitHandler(req, res);
		},
	}),

    execute: async (req, res, guildProfile) => {
        if (!guildProfile) return res.status(404).send({ error: { name: "Guild Profile Not Found", message: "The guild profile could not be found" } }).end();

        const robloxId = req.params.robloxId;
        if (!robloxId) return res.status(400).send({ error: { name: "Missing Roblox Id", message: "Provide a User Roblox ID in the URL" } }).end();

        const user = await guildProfile.getUser(robloxId);
        if (!user) return res.status(404).send({ error: { name: "User Not Found", message: "The user could not be found" } }).end();

        const includeLinkedguilds = client.Functions.StringToBoolean(req.query.includeLinkedguilds as string || "false");

        const returnData = [];
        returnData.push({
            guild: {
                id: guildProfile.guild.id,
                shortname: guildProfile.guild.shortname,
            },
            data: {
                roblox: user.roblox,
                note: user.note,
                ranklock: user.ranklock,
                points: user.points,
                pending: await guildProfile.calculateUserPendingPoints(user.roblox.id) || 0,
            }
        })

        if (includeLinkedguilds) {
            for (const linkedGuild of guildProfile.linkedGuilds.values()) {
                const linkedGuildData = await client.Database.GetGuildProfile(linkedGuild.id);
                if (!linkedGuildData) continue;

                const linkedGuildUser = await linkedGuildData.getUser(user.roblox.id);
                returnData.push({
                    guild: {
                        id: linkedGuildData.guild.id,
                        shortname: linkedGuildData.guild.shortname,
                    },
                    data: {
                        roblox: linkedGuildUser.roblox,
                        note: linkedGuildUser.note,
                        ranklock: linkedGuildUser.ranklock,
                        points: linkedGuildUser.points,
                        pending: await linkedGuildData.calculateUserPendingPoints(user.roblox.id) || 0,
                    }
                })
            }
        }

        return res.status(200).send(returnData).end();
    },
})