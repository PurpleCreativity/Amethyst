import { AxiosError } from "axios";
import Route from "../../../../classes/Route.js";
import client from "../../../../index.js";

import url from "node:url";

const redirect = new Route({
    path: "auth/discord/redirect",
    method: "GET",

    public: true,

    execute: async (req, res) => {
        res.status(200).redirect(client.config.credentials.discordOAuthRedirectLink);
    }
})

const callback = new Route({
    path: "auth/discord/callback",
    method: "GET",

    public: true,

    execute: async (req, res) => {
        if (!client.user) return res.status(500).send("Client is not logged in");

        const { code } = req.query;
        if (!code) return res.status(400).send("No code provided");

        const formData1 = new url.URLSearchParams({
            client_id: client.user.id,
            client_secret: client.config.credentials.discordClientSecret,
            grant_type: "authorization_code",
            code: code.toString(),
            redirect_uri: `${client.config.baseURL}api/v1/auth/discord/callback`
        });

        const output = await client.Axios.post("https://discord.com/api/oauth2/token", formData1, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        if (!output.data.access_token) return res.status(500).send("No access token provided");
        const user = await client.Axios.get("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${output.data.access_token}` } });

        const formData2 = new url.URLSearchParams({
            client_id: client.user.id,
            client_secret: client.config.credentials.discordClientSecret,
            grant_type: "refresh_token",
            refresh_token: output.data.refresh_token,
        });
        const refresh = await client.Axios.post("https://discord.com/api/oauth2/token", formData2, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });

        res.status(200).send(user.data);
    }
});

export default [redirect, callback];