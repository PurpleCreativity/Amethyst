import type express from "express";
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

    function: (req: express.Request, res: express.Response) => Promise<unknown>;
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
    ) => Promise<unknown>;

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

        /*
        const APIKey = (req.headers["x-api-key"] ||
            req.headers["X-Api-Key"] ||
            req.headers.authorization ||
            req.headers.Authorization) as string | undefined;
        if (!APIKey) {
            return res.status(401).send(client.API.formatError(401, "No API Key provided."));
        }

        if (!/^[a-zA-Z0-9-]{40,60}$/.test(APIKey)) {
            return res.status(400).send(client.API.formatError(400, "Invalid API Key format."));
        }

        const { guildProfile, keyData } = (await client.Database.fetchGuildFromAPIKey(APIKey)) || {};
        if (!guildProfile || !keyData) {
            return res.status(401).send(client.API.formatError(401, "Invalid API Key provided."));
        }
        if (!guildProfile.API.enabled) {
            return res.status(403).send(client.API.formatError(403, "API is disabled for this guild."));
        }

        if (!keyData.enabled) {
            return res.status(403).send(client.API.formatError(403, "API Key is disabled."));
        }

        if (
            this.permissions.length &&
            !keyData.permissions.some((permission) => this.permissions?.includes(permission))
        ) {
            return res.status(403).send(client.API.formatError(403, "Insufficient Permissions."));
        }
        */

        return await this.function(req, res);
    };
}
