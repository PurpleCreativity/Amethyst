import Route from "../../../classes/Route.js";
import isAuthenticated from "../../middlewares/isAuthenticated.js";

const route = new Route({
    path: "login",
    method: "GET",

    public: true,
    middleware: [isAuthenticated],

    execute(req, res) {
        res.status(200).redirect("/home");
    }
})

export default route;