import fs from "node:fs";
import path from "node:path";
import express from "express";
import ratelimit from "express-rate-limit";
import type Client from "../classes/Client.ts";
import Route from "../classes/Route.js";
import { HttpStatusCodes } from "../types/core/API.js";

export default class API {
    client: Client;
    private server: express.Application = express();

    constructor(client: Client) {
        this.client = client;
    }

    loadRoutes = async (Filespath: string) => {
        const routesDir = path.join(process.cwd(), Filespath);

        const loadRoutesfromDir = async (dir: string) => {
            for (const routeFile of fs.readdirSync(dir)) {
                const routePath = path.join(dir, routeFile);
                if (fs.statSync(routePath).isDirectory()) {
                    await loadRoutesfromDir(routePath);
                    continue;
                }

                if (!routePath.endsWith(".js")) continue;

                const route = await import(`file://${routePath}`).then((module) => module.default);

                if (!(route instanceof Route)) {
                    this.client.warn(`Route [${routePath}] is not a valid route.`);
                    continue;
                }

                // Determine the relative path
                const relativePath = path.relative(routesDir, routePath);

                // Convert file path to route URL, excluding folders wrapped in `()`
                const routeUrl = `/${relativePath
                    .split(path.sep) // Split into path segments
                    .filter((segment) => !segment.startsWith("(") || !segment.endsWith(")")) // Exclude segments wrapped in `()`
                    .join("/") // Rejoin path
                    .replace(/\\/g, "/") // Normalize slashes
                    .replace(".js", "")}` // Remove .js extension
                    .replace(/\[(\w+)]/g, ":$1"); // Replace dynamic segments `[param]` with `:param`

                this.server[route.method.toLocaleLowerCase() as keyof express.Application](
                    routeUrl,
                    ratelimit({
                        windowMs: route.rateLimit.windowMs,
                        max: route.rateLimit.limit,
                        message: this.formatError(429, "You are being rate limited. Please try again later."),
                    }),
                    route.middlewares,
                    route.execute,
                );
            }
        };

        await loadRoutesfromDir(routesDir);
    };

    formatError = (code: number, message: string, details?: Record<string, unknown>) => {
        return {
            code: code,
            error: HttpStatusCodes[code] || "UNKNOWN",
            message: message,
            details: details,
        };
    };

    generateKey() {
        const keyLength = Math.floor(Math.random() * (40 - 20 + 1)) + 40;
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-";
        let key = "";
        for (let i = 0; i < keyLength; i++) {
            key += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return key;
    }

    init = async () => {
        await this.loadRoutes("build/routes");

        this.server.use(express.json());
        this.server.use(express.urlencoded({ extended: true }));
        this.server.set("trust proxy", 1);

        this.server.listen(this.client.config.port, () => {
            this.client.success(`Server is running on port ${this.client.config.port}`);
        });
    };
}
