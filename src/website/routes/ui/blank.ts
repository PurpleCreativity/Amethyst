import Route from "../../../classes/Route.js";

const route = new Route({
    path: "",
    public: true,
    method: "GET",
    execute: (req, res) => {
        res.redirect("/home");
    }
})

export default route