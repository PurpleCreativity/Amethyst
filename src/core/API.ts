import type SuperClient from "../classes/SuperClient.js";
import express from "express";
import rateLimit from "express-rate-limit";
import fs from "node:fs"
import path from "node:path"
import Route from "../classes/Route.js";
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

	Limiter = rateLimit({
		windowMs: 1 * 60 * 1000, // 1 minute
		limit: 120, // Limit each IP to 120 requests per `windowMs`
		standardHeaders: 'draft-6', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
		legacyHeaders: true, // Enable the `X-RateLimit-*` headers.

		handler: (req, res) => {
			res.status(429).sendFile(path.join(process.cwd(), "src/website/html/429.html"));
		},
	})

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
				const route = await import(`file://${path.join(process.cwd(), "build/website/routes/api", folder, file)}`).then(res => res.default);
				if (!(route instanceof Route)) continue;

				console.log(`Loaded API Route: ${route.path}`)
				this.APIRouter[route.method](`/${folder}/${route.path}`, route.Execute())
			}
		}
	}

	LoadUIRoutes = async () => {
		const files = fs.readdirSync(path.join(process.cwd(), "build/website/routes/ui")).filter(file => file.endsWith(".js"))
		for (const file of files) {
			const route = await import(`file://${path.join(process.cwd(), "build/website/routes/ui", file)}`).then(res => res.default);
			if (!(route instanceof Route)) continue;

			console.log(`Loaded UI Route: ${route.path}`)
			this.UIRouter[route.method](`/${route.path}`, route.Execute())
		}
	}

	Init = async () => {
		await this.LoadAPIRoutes();
		await this.LoadUIRoutes();

		this.Server.use(express.json())
		this.Server.use(this.Limiter)
		this.Server.use("/api/", this.APIRouter)
		this.Server.use("/", this.UIRouter)
		this.Server.use((req, res) => {
			res.status(404).sendFile(path.join(process.cwd(), "src/website/html/404.html"));
		});
		
		this.Server.listen(this.client.config.port)

		this.client.success("Initialized API");
	}
}