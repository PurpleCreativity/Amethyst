import Route from "../../../../classes/Route.js";
import { Issuer, TokenSet, custom, generators } from "openid-client";
import client from "../../../../index.js";

const issuer = await Issuer.discover("https://apis.roblox.com/oauth/.well-known/openid-configuration");
const issuerClient = new issuer.Client({
    client_id: client.config.credentials.robloxOauthClientId,
    client_secret: client.config.credentials.robloxOAuthSecret,
    redirect_uris: [`http://localhost:${client.config.port}/api/v1/roblox/oauth/callback`],
    response_types: ["code"],
    scope: "openid profile",
    id_token_signed_response_alg: "ES256",
});
issuerClient[custom.clock_tolerance] = 180;



const redirect = new Route({
    path: "roblox/oauth/redirect",
    method: "GET",

    public: true,

    execute: async (req, res) => {
        const state = generators.state();
        const nonce = generators.nonce();

        res.status(200).redirect(
            issuerClient.authorizationUrl({
                scope: issuerClient.scope as string,
                state,
                nonce,
            })
        )
    }
});

const callback = new Route({
    path: "roblox/oauth/callback",
    method: "GET",

    public: true,

    execute: async (req, res) => {
        const params = issuerClient.callbackParams(req);
        const tokenSet = await issuerClient.callback(
            `http://localhost:${client.config.port}/api/v1/roblox/oauth/callback`,
            params,
            { nonce: req.query.nonce as string, state: req.query.state as string }
        );

        console.log(tokenSet);
        res.status(200).send("Account linked successfully");
    }
})

export default [redirect, callback];