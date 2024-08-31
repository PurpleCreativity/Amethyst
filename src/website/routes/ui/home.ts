import Route from "../../../classes/Route.js";
import path from "node:path"
import isAuthenticated from "../../middlewares/isAuthenticated.js";

const route = new Route({
    path: "home",
    method: "GET",

    public: true,
    middleware: [isAuthenticated],

    execute(req, res) {
        res.status(200).sendFile(path.join(process.cwd(), "src/website/html/home.html"));
    }
})

export default route;