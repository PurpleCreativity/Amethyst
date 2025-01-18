import type express from "express";
import type { RoutePermission } from "../types/core/API.js";
import type GuildProfile from "./database/GuildProfile.js";

export type RouteMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" | "CONNECT" | "TRACE";

export type rateLimit = {
    /**
     * The time window in milliseconds for which the rate limit applies.
     * For example, setting `windowMs: 60000` means a 1-minute window.
     */
    windowMs: number;

    /**
     * The maximum number of requests allowed during the time window.
     * Requests exceeding this limit will be rejected.
     */
    limit: number;
};

export type RouteOptions = {
    method: RouteMethod;

    /**
     * Represents the rate limit configuration for a route.
     */
    rateLimit: rateLimit;

    /**
     * An optional array of Express request handlers (middlewares).
     * These functions run before the route's main function is executed.
     */
    middlewares?: express.RequestHandler[];

    /**
     * Indicates whether the route is publicly accessible.
     * - `true` (default): No authentication required.
     * - `false`: Requires an API key and permissions check.
     */
    public?: boolean;

    /**
     * A list of permissions required to access the route.
     * This property is only relevant when `public` is set to `false`.
     * Each permission corresponds to a specific allowed actions in the system.
     */
    permissions?: RoutePermission[];

    /**
     * Marks the route as deprecated.
     * If `true`, this indicates that the route will be removed in future versions.
     */
    deprecated?: boolean;

    /**
     * The main function executed when the route is accessed.
     * This function receives the Express request and response objects,
     * along with an optional `guildProfile` if the route is not public.
     *
     * @param req - The incoming HTTP request object.
     * @param res - The outgoing HTTP response object.
     * @param guildProfile - The guild profile data, available only when `public` is `false`.
     * @returns A promise representing the result of the operation.
     */
    function(req: express.Request, res: express.Response, guildProfile?: GuildProfile): Promise<unknown>;
};

export default class Route {
    readonly method: RouteMethod;
    readonly rateLimit: rateLimit;
    readonly middlewares: express.RequestHandler[];

    readonly public: boolean;
    readonly permissions: RoutePermission[];
    readonly deprecated: boolean;

    private function: (req: express.Request, res: express.Response, guildProfile?: GuildProfile) => Promise<unknown>;

    constructor(options: RouteOptions) {
        this.method = options.method;
        this.rateLimit = options.rateLimit;
        this.middlewares = options.middlewares || [];
        this.public = options.public ?? true;
        this.permissions = options.permissions || [];
        this.deprecated = options.deprecated ?? false;
        this.function = options.function;
    }

    async execute(req: express.Request, res: express.Response) {
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
    }
}
