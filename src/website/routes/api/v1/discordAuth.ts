import Route from "../../../../classes/Route.js";
import client from "../../../../index.js";
import passport from "passport";
import { type Profile, Strategy } from "passport-discord";
import type { VerifyCallback } from "passport-oauth2";
import userProfile from "../../../../schemas/userProfile.js";

passport.serializeUser((user: any, done) => {
    return done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await userProfile.findById(id);
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
})

passport.use(
    new Strategy(
        {
            clientID: client.user?.id as string,
            clientSecret: client.config.credentials.discordClientSecret,
            callbackURL: `${client.config.baseURL}api/v1/auth/discord/callback`,
            scope: ["identify", "guilds"]
        },
        async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
            const userDataProfile = await client.Database.GetUserProfile(profile.id)
            userDataProfile.user.name = profile.username;
            userDataProfile.session.accessToken = accessToken;
            userDataProfile.session.refreshToken = refreshToken

            await userDataProfile.save();

            return done(null, userDataProfile);
        }
    )
);

const redirect = new Route({
    path: "auth/discord/redirect",
    method: "GET",

    middleware: [passport.authenticate("discord")],
    public: true,

    execute: async (req, res) => {
        res.status(200).redirect(client.config.credentials.discordOAuthRedirectLink);
    }
})

const callback = new Route({
    path: "auth/discord/callback",
    method: "GET",

    middleware: [passport.authenticate("discord")],
    public: true,

    execute: async (req, res) => {
        res.send(req.user);
    }
});

const status = new Route({
    path: "status",
    method: "GET",

    public: true,

    execute: async (req, res) => {
        res.send(req.user);
    }
});

export default [redirect, callback, status];
