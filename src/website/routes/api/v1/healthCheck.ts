import rateLimit from "express-rate-limit";
import Route from "../../../../classes/Route.js";
import client from "../../../../index.js";

const route = new Route({
    path: "healthcheck",
    public: true,
    rateLimit: rateLimit({
		windowMs: 1 * 60 * 1000,
		limit: 120,
		standardHeaders: 'draft-6',
		legacyHeaders: true,

		handler: (req, res) => {
			return client.API.rateLimitHandler(req, res);
		},
	}),
    method: "GET",
    execute: (req, res) => {
        res.status(200).send("OK").end();
    },
})

export default route;