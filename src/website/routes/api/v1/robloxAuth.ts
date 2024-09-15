import Route from "../../../../classes/Route.js";
import client from "../../../../index.js";
import { Issuer, custom, generators } from "openid-client";
import type { userProfileInterface } from "../../../../schemas/userProfile.js";
import { isAuthenticatedDiscord } from "../../../middlewares/isAuthenticated.js";

const secureCookieConfig = {
    secure: true,
    httpOnly: true,
    signed: true,
};

const issuer = await Issuer.discover(
    "https://apis.roblox.com/oauth/.well-known/openid-configuration"
);

const issuerClient = new issuer.Client({
    client_id: client.config.credentials.robloxOauthClientId,
    client_secret: client.config.credentials.robloxOAuthSecret,
    redirect_uris: [`${client.config.baseURL}api/v1/auth/roblox/callback`],
    response_types: ["code"],
    scope: "openid",
    id_token_signed_response_alg: "ES256",
});
issuerClient[custom.clock_tolerance] = 180;

const redirect = new Route({
    path: "auth/roblox/redirect",
    method: "GET",

    public: true,

    middleware: [isAuthenticatedDiscord],

    execute: async (req, res) => {
        const state = generators.state();
        const nonce = generators.nonce();

        res
            .cookie("state", state, secureCookieConfig)
            .cookie("nonce", nonce, secureCookieConfig)
            .redirect(
                issuerClient.authorizationUrl({
                    scope: "openid",
                    state,
                    nonce,
                })
            );
    }
});

const callback = new Route({
    path: "auth/roblox/callback",
    method: "GET",

    public: true,

    execute: async (req, res) => {
        try {
            const params = issuerClient.callbackParams(req);
            const tokenSet = await issuerClient.callback(
                `${client.config.baseURL}api/v1/auth/roblox/callback`,
                params,
                {
                    state: req.signedCookies.state,
                    nonce: req.signedCookies.nonce,
                }
            );

            const robloxUser = await client.Functions.GetRobloxUser(tokenSet.claims().sub);
            if (!robloxUser) {
                res.status(400).send("Invalid roblox user");
                return;
            }

            const discordUser = req.user as userProfileInterface;
            await discordUser.linkRoblox(robloxUser);

            if (client.Database.cache.users.get(discordUser.user.id)) {
                client.Database.cache.users.delete(discordUser.user.id);
            }

            res
                //.cookie("roblox_session", tokenSet, secureCookieConfig)
                .clearCookie("state")
                .clearCookie("nonce")
                .status(200)
                .redirect("/home");
        } catch (error) {
            res.status(500).send("An error occured while linking your roblox account");
        }
    }
});

export default [redirect, callback];