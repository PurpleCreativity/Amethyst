import rateLimit from "express-rate-limit";
import Route from "../../../../classes/Route.js";
import client from "../../../../index.js";

export default new Route({
    path: "healthcheck",
    public: true,
    rateLimit: rateLimit({
		windowMs: 1 * 60 * 1000,
		limit: 120,
		standardHeaders: true,
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