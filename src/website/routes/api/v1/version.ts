import Route from "../../../../classes/Route.js";
import client from "../../../../index.js";

const route = new Route({
    path: "version",
    public: true,
    method: "GET",
    execute: async (req, res) => {
        res.status(200).send({
            bot: client.config.version,
            webserver: process.env.HEROKU_RELEASE_VERSION || "v0",
        })
    }
})

export default route;