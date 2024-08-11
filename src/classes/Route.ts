import type express from "express";

export type APIMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" | "CONNECT" | "TRACE"
export type APIPermissions = "Administrator" | "ViewPoints" | "CreatePointLogs" | "ViewSchedule" | "Moderation" | "Roblox";

type RouteOptions = {
	path: string
	method : APIMethods
	public?: boolean,
    deprecated?: boolean,
	permissions?: APIPermissions[],
	description?: string,

	execute(req: express.Request, res: express.Response): void
}

class Route {
	path: string
	method : Lowercase<APIMethods>
	public: boolean
    deprecated: boolean
	permissions: APIPermissions[]
	description: string

	execute: (req: express.Request, res: express.Response) => void

	constructor(opts: RouteOptions) {
		this.path = opts.path
		this.method = opts.method.toLowerCase() as Lowercase<APIMethods>
		this.public = opts.public ?? false
		this.permissions = opts.permissions ?? [];
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

                this.execute(req, res);
                //client.Logs.LogAPI(req, res);
            } catch (error) {
                //client.Logs.LogError(error as Error);
                return res.status(500).send({ error: "An error occured while processing your request.", message: error }).end();
            }
        }
    }
}

export default Route;