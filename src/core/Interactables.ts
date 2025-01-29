import fs from "node:fs";
import path from "node:path";
import { Collection, REST, Routes } from "discord.js";
import type Client from "../classes/Client.js";
import { MessageContextMenuCommand, UserContextMenuCommand } from "../classes/components/ContextMenuCommand.js";
import SlashCommand from "../classes/components/SlashCommand.js";

export default class Interactables {
    client: Client;
    REST: REST = new REST();

    stored: {
        SlashCommands: Collection<string, SlashCommand>;
        MessageContextMenuCommands: Collection<string, MessageContextMenuCommand>;
        UserContextMenuCommands: Collection<string, UserContextMenuCommand>;
    };

    constructor(client: Client) {
        this.client = client;

        this.stored = {
            SlashCommands: new Collection(),
            MessageContextMenuCommands: new Collection(),
            UserContextMenuCommands: new Collection(),
        };
    }

    addInteractable = async (
        interactable: SlashCommand | MessageContextMenuCommand | UserContextMenuCommand,
    ): Promise<void> => {
        if (interactable instanceof SlashCommand) {
            if (this.stored.SlashCommands.has(interactable.name)) {
                this.client.warn(`SlashCommand [${interactable.name}] already exists, skipping...`);
                return;
            }

            this.stored.SlashCommands.set(interactable.name, interactable);
            this.client.verbose(`Added SlashCommand ${interactable.name}`);
            return;
        }

        if (interactable instanceof MessageContextMenuCommand) {
            if (this.stored.MessageContextMenuCommands.has(interactable.name)) {
                this.client.warn(`MessageContextMenuCommand [${interactable.name}] already exists, skipping...`);
                return;
            }

            this.stored.MessageContextMenuCommands.set(interactable.name, interactable);
            this.client.verbose(`Added MessageContextMenuCommand ${interactable.name}`);
            return;
        }

        if (interactable instanceof UserContextMenuCommand) {
            if (this.stored.UserContextMenuCommands.has(interactable.name)) {
                this.client.warn(`UserContextMenuCommand [${interactable.name}] already exists, skipping...`);
                return;
            }

            this.stored.UserContextMenuCommands.set(interactable.name, interactable);
            this.client.verbose(`Added MessageContextMenuCommand ${interactable.name}`);
            return;
        }

        this.client.warn(`Unknown command type: ${interactable}`);
    };

    loadInteractableFiles = async (Filespath: string): Promise<void> => {
        const dir = path.join(process.cwd(), Filespath);

        const loadfromDir = async (dir: string) => {
            for (const file of fs.readdirSync(dir)) {
                const filePath = path.join(dir, file);
                if (fs.statSync(filePath).isDirectory()) {
                    await loadfromDir(filePath);
                }

                if (!filePath.endsWith(".js")) continue;

                const module = await import(`file://${filePath}`).then((module) => module.default);
                const interactables = Array.isArray(module) ? module : [module];

                for (const interactable of interactables) {
                    this.addInteractable(interactable);
                }
            }
        };

        await loadfromDir(dir);
    };

    deployInteractables = async () => {
        if (!this.client.user) throw new Error("Client user is not defined.");

        this.client.warn(`Deploying [${this.stored.SlashCommands.size}] SlashCommands...`);
        await this.REST.put(Routes.applicationCommands(this.client.user.id), {
            body: [
                ...this.stored.SlashCommands.map((command) => {
                    if (command.selectedGuilds.length > 0) {
                        return undefined;
                    }

                    return command.toJSON();
                }),

                ...this.stored.MessageContextMenuCommands.map((command) => {
                    if (command.selectedGuilds.length > 0) {
                        return undefined;
                    }

                    return command.toJSON();
                }),

                ...this.stored.UserContextMenuCommands.map((command) => {
                    if (command.selectedGuilds.length > 0) {
                        return undefined;
                    }

                    return command.toJSON();
                }),
            ],
        });

        for (const command of this.stored.SlashCommands.values()) {
            if (!command.selectedGuilds || command.selectedGuilds.length === 0) continue;

            for (const guildId of command.selectedGuilds) {
                await this.REST.put(Routes.applicationGuildCommands(this.client.user.id, guildId), {
                    body: this.stored.SlashCommands.map((command) => {
                        if (!command.selectedGuilds.includes(guildId)) {
                            return undefined;
                        }

                        return command.toJSON();
                    }),
                });
            }
        }

        this.client.success(`Successfully deployed [${this.stored.SlashCommands.size}] SlashCommands, ${this.stored.MessageContextMenuCommands.size} MessageContextMenuCommands and ${this.stored.UserContextMenuCommands.size} UserContextMenuCommands!`);
    };

    clearInteractables = async (): Promise<void> => {
        if (!this.client.user) throw new Error("Client user is not defined.");

        await this.REST.put(Routes.applicationCommands(this.client.user.id), {
            body: [],
        });

        for (const command of this.stored.SlashCommands.values()) {
            if (command.selectedGuilds.length === 0) continue;

            for (const guildId of command.selectedGuilds) {
                await this.REST.put(Routes.applicationGuildCommands(this.client.user.id, guildId), {
                    body: [],
                });
            }
        }

        this.client.warn("Cleared all commands.");
    };

    afterInit = async (): Promise<void> => {
        this.REST.setToken(this.client.config.credentials.discordToken);
        await this.loadInteractableFiles("build/interactables");

        if (this.client.redeployInteractables) {
            await this.clearInteractables();
            await this.deployInteractables();
        }
    };
}
