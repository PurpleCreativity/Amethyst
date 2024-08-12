import Route from "../../../classes/Route.js";
import path from "node:path"

const route = new Route({
    path: "tos",
    public: true,
    method: "GET",

    execute(req, res) {
        res.status(404).sendFile(path.join(process.cwd(), "src/website/html/tos.html"));
    }
})

export default route;