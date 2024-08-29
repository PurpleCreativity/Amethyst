import Route from "../../../classes/Route.js";
import path from "node:path"

const route = new Route({
    path: "home",
    public: true,
    method: "GET",
    execute(req, res) {
        res.status(200).sendFile(path.join(process.cwd(), "src/website/html/home.html"));
    }
})

export default route;