import type express from "express";
import client from "../main.js";
import type { guildProfileInterface } from "../schemas/guildProfile.js";
import type { ValidPermissions } from "../types/global.js";

export type RouteMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" | "CONNECT" | "TRACE";
export type rateLimit = {
    windowMs: number;
    limit: number;
};
export type RouteOptions = {
    method: RouteMethod;
    rateLimit: rateLimit;
    middlewares?: express.RequestHandler[];

    public?: boolean;
    permissions?: ValidPermissions[];
    deprecated?: boolean;

    function: (req: express.Request, res: express.Response, guildProfile?: guildProfileInterface) => Promise<void>;
};

export default class Route {
    readonly method: RouteMethod;
    readonly rateLimit: rateLimit;
    readonly middlewares: express.RequestHandler[];

    readonly public: boolean;
    readonly permissions: ValidPermissions[];
    readonly deprecated: boolean;

    private function: (
        req: express.Request,
        res: express.Response,
        guildProfile?: guildProfileInterface,
    ) => Promise<void>;

    constructor(options: RouteOptions) {
        this.method = options.method;
        this.rateLimit = options.rateLimit;
        this.middlewares = options.middlewares || [];
        this.public = options.public ?? true;
        this.permissions = options.permissions || [];
        this.deprecated = options.deprecated ?? false;
        this.function = options.function;
    }

    execute = async (req: express.Request, res: express.Response) => {
        if (this.public) {
            return await this.function(req, res);
        }

        const APIKey = (req.headers["x-api-key"] ||
            req.headers["X-Api-Key"] ||
            req.headers.authorization ||
            req.headers.Authorization) as string | undefined;
        if (!APIKey) {
            return res.status(401).send(client.API.formatError(401, "UNAUTHORIZED", "No API Key provided."));
        }

        const { guildProfile, keyData } = (await client.Database.fetchGuildFromAPIKey(APIKey)) || {};
        if (!guildProfile || !keyData) {
            return res.status(401).send(client.API.formatError(401, "UNAUTHORIZED", "Invalid API Key provided."));
        }
        if (!guildProfile.API.enabled) {
            return res.status(403).send(client.API.formatError(403, "FORBIDDEN", "API is disabled for this guild."));
        }

        if (!keyData.enabled) {
            return res.status(403).send(client.API.formatError(403, "FORBIDDEN", "API Key is disabled."));
        }

        if (
            this.permissions.length &&
            !keyData.permissions.some((permission) => this.permissions?.includes(permission))
        ) {
            return res.status(403).send(client.API.formatError(403, "FORBIDDEN", "Insufficient Permissions."));
        }

        return await this.function(req, res, guildProfile);
    };
}
