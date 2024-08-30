import type SuperClient from "../classes/SuperClient.js";
import express from "express";
import session from "express-session";
import fs from "node:fs"
import path from "node:path"
import Route from "../classes/Route.js";
import MongoStore from "connect-mongo";
import passport from "passport";
import type { APIMethods, APIPermissions } from "../classes/Route.js";

export type RouteOptions = {
	path: string
	method : APIMethods
	public?: boolean,
	permissions?: APIPermissions[],
	description?: string,

	execute(req: express.Request, res: express.Response): void
}

export default class API {
    client: SuperClient;

    constructor(client: SuperClient) {
        this.client = client;
    }

	Server = express();
	APIRouter: express.Router = express.Router({ caseSensitive: false });
	UIRouter: express.Router = express.Router({ caseSensitive: false });

	rateLimitHandler(req: express.Request, res: express.Response) {
		res.status(429).sendFile(path.join(process.cwd(), "src/website/html/429.html"));
	}

	GenerateKey() {
		const key = `AMETHYST_API_KEY_${this.client.Functions.GenerateID().replace(/-/g, "")}${this.client.Functions.GenerateID().replace(/-/g, "")}${this.client.Functions.GenerateID().replace(/-/g, "")}${this.client.Functions.GenerateID().replace(/-/g, "")}${this.client.Functions.GenerateID().replace(/-/g, "")}`;

		return key
	}

	GetGuildProfileFromAPIKey = async (APIKey: string) => {
		const guilds = await this.client.Database.GetAllGuilds(true);

		for (const guildProfile of guilds.values()) {
			for (const keyData of guildProfile.API.keys.values()) {
				const decryptedKey = this.client.Functions.Decrypt(keyData.key, guildProfile.iv);
				if (decryptedKey === APIKey) {
					return {
						guildProfile: guildProfile,
						keyData: keyData
					};
				}
			}
		}
	}

	LoadAPIRoutes = async () => {
		const routeFolders = fs.readdirSync(path.join(process.cwd(), "build/website/routes/api"));

		for (const folder of routeFolders) {
			if (!fs.statSync(path.join(process.cwd(), "build/website/routes/api", folder)).isDirectory()) {
				continue;
			}

			const files = fs.readdirSync(path.join(process.cwd(), "build/website/routes/api", folder)).filter(file => file.endsWith(".js"))
			for (const file of files) {
				const routes = await import(`file://${path.join(process.cwd(), "build/website/routes/api", folder, file)}`).then(res => res.default);
				const routesArray = Array.isArray(routes) ? routes : [routes];

				for (const route of routesArray) {
					if (!(route instanceof Route)) continue;

					const middleware = [
						...route.middleware,
						route.Execute()
					]

					this.APIRouter[route.method](`/${folder}/${route.path}`, ...middleware)
					if (route.rateLimit) this.Server.use(`/api/${folder}/${route.path}`, route.rateLimit);
				}
			}
		}
	}

	LoadUIRoutes = async () => {
		const files = fs.readdirSync(path.join(process.cwd(), "build/website/routes/ui")).filter(file => file.endsWith(".js"))

		for (const file of files) {
			const routes = await import(`file://${path.join(process.cwd(), "build/website/routes/ui", file)}`).then(res => res.default);
			const routesArray = Array.isArray(routes) ? routes : [routes];

			for (const route of routesArray) {
				if (!(route instanceof Route)) continue;

				const middleware = [
					...route.middleware,
					route.Execute()
				]

				this.UIRouter[route.method](`/${route.path}`, ...middleware)
				if (route.rateLimit) this.Server.use(`/${route.path}`, route.rateLimit);
			}
		}
	}

	Init = async () => {
		await this.LoadAPIRoutes();
		await this.LoadUIRoutes();

		this.Server.use(express.json())
		this.Server.use(express.urlencoded({ extended: true }))

		this.Server.use(session({
			secret: this.client.config.credentials.sessionSecret,
			cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },

			resave: false,
			saveUninitialized: false,

			store: MongoStore.create({
				mongoUrl: this.client.config.credentials.databaseURL,
			})
		}))

		this.Server.use(passport.initialize())
		this.Server.use(passport.session())
		//this.Server.enable("trust proxy")

		this.Server.use("/api/", this.APIRouter)
		this.Server.use("/", this.UIRouter)
		this.Server.use((req, res) => {
			res.status(404).sendFile(path.join(process.cwd(), "src/website/html/404.html"));
		});
		
		this.Server.listen(this.client.config.port)

		this.client.success(`Initialized API on port ${this.client.config.port}`);
	}
}