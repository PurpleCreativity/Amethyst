import type express from "express";
import client from "../index.js";
import type { guildProfileInterface } from "../schemas/guildProfile.js";

export type APIMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" | "CONNECT" | "TRACE"
export type APIPermissions = "Administrator" | "ViewPoints" | "CreatePointLogs" | "ViewSchedule" | "Moderation" | "Roblox";

type RouteOptions = {
	path: string
	method : APIMethods
	public?: boolean,
	rateLimit?: any,
    deprecated?: boolean,
	permissions?: APIPermissions[],
	middleware?: express.RequestHandler[],
	description?: string,

	execute(req: express.Request, res: express.Response, guildDataProfile?: guildProfileInterface | undefined): void
}

class Route {
	path: string
	method : Lowercase<APIMethods>
	public: boolean
	rateLimit?: any
    deprecated: boolean
	permissions: APIPermissions[]
	middleware: express.RequestHandler[]
	description: string

	execute: (req: express.Request, res: express.Response, guildDataProfile?: guildProfileInterface | undefined) => void

	constructor(opts: RouteOptions) {
		this.path = opts.path
		this.method = opts.method.toLowerCase() as Lowercase<APIMethods>
		this.public = opts.public ?? false
		this.rateLimit = opts.rateLimit ?? undefined
		this.permissions = opts.permissions ?? [];
		this.middleware = opts.middleware ?? []
        this.deprecated = opts.deprecated ?? false
		this.description = opts.description ?? "None"
		
		this.execute = opts.execute
	}

    Execute() {
        return async (req: express.Request, res: express.Response) => {
            try {
                if (this.public) {
                    this.execute(req, res);
                    return;
                }

				const APIKey = req.headers["x-api-key"] || req.headers["X-Api-Key"] || req.headers.authorization || req.headers.Authorization;
				if (!APIKey) return res.status(401).send({ error: { name: "No API Key provided", message: `Provide a API key header ("x-api-key" or "X-Api-Key" or "authorization" or "Authorization") with your request` } }).end();

				const guildAndkey = await client.API.GetGuildProfileFromAPIKey(APIKey as string);
				const guildProfile = guildAndkey?.guildProfile;
				const keyData = guildAndkey?.keyData;

				if (!guildProfile || !keyData) return res.status(401).send({ error: { name: "Invalid API Key", message: "The API key provided is invalid" } }).end();

				if (guildProfile.API.banned) return res.status(401).send({ error: { name: "API Banned", message: "Your guild has been API banned, contact the developer for more information" } }).end();
				if (!guildProfile.API.enabled) return res.status(401).send({ error: { name: "API Disabled", message: "Your guild has disabled all API functionability" } }).end();
				if (!keyData.enabled) return res.status(401).send({ error: { name: "Key disabled", message: "The provided API Key is disabled" } }).end();
				if (keyData.permissions.includes("Administrator")) return this.execute(req, res, guildProfile);

				if (this.permissions.length > 0) {
					const hasPermission = this.permissions.some(permission => keyData.permissions.includes(permission));
					if (!hasPermission) return res.status(403).send({ error: { name: "Insufficient Permissions", message: "The provided API Key does not have sufficient permissions to access this route" } }).end();
				}

                this.execute(req, res, guildProfile);
            } catch (error) {
                return res.status(500).send({ error: { name: "Internal Server Error", message: error } }).end();
            }
        }
    }
}

export default Route;