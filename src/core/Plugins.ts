import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import type Client from "../classes/Client.js";
import Plugin from "../classes/Plugin.js";

export default class Plugins {
    client: Client;
    loadedPlugins: Plugin[] = [];

    constructor(client: Client) {
        this.client = client;
    }

    getPlugin = (name: string): Plugin | undefined => {
        return this.loadedPlugins.find((plugin) => plugin.name === name);
    };

    loadPlugin = async (pluginPath: string): Promise<void> => {
        if (!fs.existsSync(pluginPath)) {
            this.client.warn(`Skipping [${pluginPath}] Plugin as it does not have a main.js file.`);
            return;
        }

        const plugin = await import(`file://${pluginPath}`).then((module) => module.default);

        if (!(plugin instanceof Plugin)) {
            this.client.warn(`Plugin [${pluginPath}] is not a valid plugin.`);
            return;
        }

        this.loadedPlugins.push(plugin);
    };

    loadPlugins = async (): Promise<void> => {
        const pluginsDir = path.join(process.cwd(), "src/plugins");

        const loadPluginFromDir = async (dir: string) => {
            for (const plugin of fs.readdirSync(dir)) {
                const pluginPath = path.join(dir, plugin);
                if (fs.statSync(pluginPath).isDirectory()) {
                    await loadPluginFromDir(pluginPath);
                } else if (plugin === "main.js") {
                    await this.loadPlugin(pluginPath);
                }
            }
        };

        await loadPluginFromDir(pluginsDir);
    };

    Init = async (): Promise<void> => {
        await this.loadPlugins();

        for (const plugin of this.loadedPlugins) {
            await plugin.Init(this.client);
        }
    };
}
