import Route from "../../../../classes/Route.js";

export default new Route({
    path: "roblox/experiences/start",
    method: "GET",

    public: true,

    execute: async (req, res) => {
        const placeId = req.query.placeId;
        const gameInstanceId = req.query.gameInstanceId;

        if (!placeId) return res.status(400).json({ error: { name: "Missing placeId query parameter", message: "Input a placeId query parameter" } });

        if (gameInstanceId) return res.status(200).redirect(`roblox://experiences/start?placeId=${placeId}&gameInstanceId=${gameInstanceId}`);
        
        return res.status(200).redirect(`roblox://experiences/start?placeId=${placeId}`);
    }
})