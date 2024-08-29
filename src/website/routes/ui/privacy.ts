import Route from "../../../classes/Route.js";
import path from "node:path"

const route = new Route({
    path: "privacy",
    public: true,
    method: "GET",

    execute: (req, res) => {
        res.status(200).sendFile(path.join(process.cwd(), "src/website/html/privacy.html"));
    }
})

export default route;