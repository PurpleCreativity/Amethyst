import Route from "../../../../classes/Route.js";

const route = new Route({
    path: "healthcheck",
    public: true,
    method: "GET",
    execute: (req, res) => {
        res.status(200).send("OK").end();
    },
})

export default route;