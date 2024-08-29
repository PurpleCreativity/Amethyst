import Route from "../../../../classes/Route.js";
import client from "../../../../index.js";
import rateLimit from "express-rate-limit";
import type { PointLog } from "../../../../schemas/guildProfile.js";

type PointLogData = {
    creator : {
        username : string,
        id: number,
    },

	data : {
		username : string,
        id: number,
        
		points : number,
	}[]
	notes : string | undefined,
}

const isValidLog = (data: any) => {
    if (!data) return false;

    if (!data.creator) return false;
    if (!data.creator.username || typeof data.creator.username !== "string") return false;
    if (!data.creator.id || typeof data.creator.id !== "number") return false;

    if (!data.data || data.data.length === 0) return false;
    for (const log of data.data) {
        if (!log.username || typeof log.username !== "string") return false;
        if (!log.id || typeof log.id !== "number") return false;
        if (!log.points || typeof log.points !== "number") return false;
    }

    if (data.notes && typeof data.notes !== "string") return false;

    return true;
}

export default new Route({
    path: "guild/data/pointlogs/new",
    method: "POST",
    public: false,
    permissions: ["CreatePointLogs"],

    rateLimit: rateLimit({
		windowMs: 1 * 60 * 1000,
		limit: 120,
		standardHeaders: true,
		legacyHeaders: true,

		handler: (req, res) => {
			return client.API.rateLimitHandler(req, res);
		},
	}),

    execute: async (req, res, guildProfile) => {
        if (!guildProfile) return res.status(404).send({ error: "Guild Profile Not Found", message: "The guild profile could not be found" }).end();

        const data : PointLogData = req.body;
        if (!isValidLog(data)) return res.status(400).send({ error: "Invalid Data", message: "The data provided was invalid" }).end();

        const currentLog = {
            id: client.Functions.GenerateID(),

            creator: {
                username: data.creator.username,
                id: data.creator.id,
            },
            data: data.data,
            notes: data.notes,

            createdAt: new Date(),
        } as PointLog;

        try {
            const creatorUser = await client.Functions.GetRobloxUser(data.creator.id);
            await guildProfile.addPointLog(currentLog, creatorUser);

            return res.status(200).send(currentLog).end();
        } catch (error) {
            return res.status(500).send({ error: "Internal Server Error", message: "An internal server error occurred" }).end();
        }
    }
})