import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Collection, REST, Routes } from "discord.js";
import type Client from "../classes/Client.js";
import { MessageContextMenuCommand, UserContextMenuCommand } from "../classes/ContextCommand.js";
import SlashCommand from "../classes/SlashCommand.js";
import type StaticButton from "../classes/StaticButton.js";

export default class Interactables {
    client: Client;
    REST: REST = new REST();

    stored: {
        SlashCommands: Collection<string, SlashCommand>;
        StaticButtons: Collection<string, StaticButton>;
        UserContextMenuCommands: Collection<string, UserContextMenuCommand>;
        MessageContextMenuCommands: Collection<string, MessageContextMenuCommand>;
    } = {
        SlashCommands: new Collection(),
        StaticButtons: new Collection(),
        UserContextMenuCommands: new Collection(),
        MessageContextMenuCommands: new Collection(),
    };

    constructor(client: Client) {
        this.client = client;
    }

    toggleCommandAvaiblityGlobally = (
        commandType: "SlashCommand" | "UserContextMenuCommand" | "MessageContextMenuCommand",
        name: string,
        disabled: boolean,
    ): void => {
        switch (commandType) {
            case "SlashCommand": {
                const command = this.stored.SlashCommands.get(name);

                if (!command) {
                    this.client.warn(`Slash Command [${name}] does not exist, skipping...`);
                    return;
                }

                command.disabled = disabled;

                break;
            }
            case "UserContextMenuCommand": {
                const command = this.stored.UserContextMenuCommands.get(name);

                if (!command) {
                    this.client.warn(`User Context Menu Command [${name}] does not exist, skipping...`);
                    return;
                }

                command.disabled = disabled;

                break;
            }
            case "MessageContextMenuCommand": {
                const command = this.stored.MessageContextMenuCommands.get(name);

                if (!command) {
                    this.client.warn(`Message Context Menu Command [${name}] does not exist, skipping...`);
                    return;
                }

                command.disabled = disabled;

                break;
            }

            default: {
                this.client.warn(`Unknown command type: [${commandType}]`);
                break;
            }
        }
    };

    addCommand = (command: SlashCommand | UserContextMenuCommand | MessageContextMenuCommand): void => {
        if (command instanceof SlashCommand) {
            if (this.stored.SlashCommands.has(command.name)) {
                this.client.warn(`Slash Command [${command.name}] already exists, skipping...`);
                return;
            }

            this.stored.SlashCommands.set(command.name, command);
        } else if (command instanceof UserContextMenuCommand) {
            if (this.stored.UserContextMenuCommands.has(command.name)) {
                this.client.warn(`User Context Menu Command [${command.name}] already exists, skipping...`);
                return;
            }

            this.stored.UserContextMenuCommands.set(command.name, command);
        } else if (command instanceof MessageContextMenuCommand) {
            if (this.stored.MessageContextMenuCommands.has(command.name)) {
                this.client.warn(`Message Context Menu Command [${command.name}] already exists, skipping...`);
                return;
            }

            this.stored.MessageContextMenuCommands.set(command.name, command);
        } else {
            this.client.warn(`Unknown command type: ${(command as object).constructor.name}`);
        }
    };

    removeCommand = (
        commandType: "SlashCommand" | "UserContextMenuCommand" | "MessageContextMenuCommand",
        name: string,
    ): void => {
        switch (commandType) {
            case "SlashCommand": {
                if (!this.stored.SlashCommands.has(name)) {
                    this.client.warn(`Slash Command [${name}] does not exist, skipping...`);
                    return;
                }

                this.stored.SlashCommands.delete(name);

                break;
            }
            case "UserContextMenuCommand": {
                if (!this.stored.UserContextMenuCommands.has(name)) {
                    this.client.warn(`User Context Menu Command [${name}] does not exist, skipping...`);
                    return;
                }

                this.stored.UserContextMenuCommands.delete(name);

                break;
            }
            case "MessageContextMenuCommand": {
                if (!this.stored.MessageContextMenuCommands.has(name)) {
                    this.client.warn(`Message Context Menu Command [${name}] does not exist, skipping...`);
                    return;
                }

                this.stored.MessageContextMenuCommands.delete(name);

                break;
            }

            default: {
                this.client.warn(`Unknown command type: [${commandType}]`);
                break;
            }
        }
    };

    loadCommandFiles = async (Filespath: string): Promise<void> => {
        const commandsDir = path.join(process.cwd(), Filespath);

        for (const folderEntry of fs.readdirSync(commandsDir)) {
            if (fs.statSync(path.join(commandsDir, folderEntry)).isDirectory()) {
                for (const fileEntry of fs
                    .readdirSync(path.join(commandsDir, folderEntry))
                    .filter((file) => file.endsWith(".js"))) {
                    if (fileEntry.endsWith(".map")) continue;
                    if (!(fs.statSync(path.join(commandsDir, folderEntry)).isFile() || fileEntry.endsWith(".js"))) {
                        this.client.warn(`Skipping [${fileEntry}] as it is not a valid command file.`);
                        continue;
                    }

                    const moduleImport = await import(`file://${path.join(commandsDir, folderEntry, fileEntry)}`).then(
                        (module) => module.default,
                    );
                    const commands = Array.isArray(moduleImport) ? moduleImport : [moduleImport];

                    for (const command of commands) {
                        this.addCommand(command);
                    }
                }
                return;
            }

            if (folderEntry.endsWith(".map")) continue;
            if (!(fs.statSync(path.join(commandsDir, folderEntry)).isFile() || folderEntry.endsWith(".js"))) {
                this.client.warn(`Skipping [${folderEntry}] as it is not a valid command file.`);
                continue;
            }

            const moduleImport = await import(`file://${path.join(commandsDir, folderEntry)}`).then(
                (module) => module.default,
            );
            const commands = Array.isArray(moduleImport) ? moduleImport : [moduleImport];

            for (const command of commands) {
                this.addCommand(command);
            }
        }
    };

    deployCommands = async (): Promise<void> => {
        if (!this.client.user) throw new Error("Client user is not defined.");

        this.client.warn(
            `Deploying [${
                this.stored.SlashCommands.size +
                this.stored.UserContextMenuCommands.size +
                this.stored.MessageContextMenuCommands.size
            }] commands...`,
        );

        await this.REST.put(Routes.applicationCommands(this.client.user.id), {
            body: [
                ...this.stored.SlashCommands.map((command) => {
                    if (command.selected_guilds.length > 0) {
                        return undefined;
                    }
                    return command.toJSON();
                }),

                ...this.stored.UserContextMenuCommands.map((command) => command.toJSON()),
                ...this.stored.MessageContextMenuCommands.map((command) => command.toJSON()),
            ],
        });

        for (const command of this.stored.SlashCommands.values()) {
            if (!command.selected_guilds || command.selected_guilds.length === 0) continue;

            for (const guildId of command.selected_guilds) {
                await this.REST.put(Routes.applicationGuildCommands(this.client.user.id, guildId), {
                    body: this.stored.SlashCommands.map((command) => {
                        if (!command.selected_guilds.includes(guildId)) {
                            return undefined;
                        }

                        return command.toJSON();
                    }),
                });
            }
        }

        this.client.success(`Successfully deployed [${this.stored.SlashCommands.size}] commands!`);
    };

    clearCommands = async (): Promise<void> => {
        if (!this.client.user) throw new Error("Client user is not defined.");

        await this.REST.put(Routes.applicationCommands(this.client.user.id), {
            body: [],
        });

        for (const command of this.stored.SlashCommands.values()) {
            if (command.selected_guilds.length === 0) continue;

            for (const guildId of command.selected_guilds) {
                await this.REST.put(Routes.applicationGuildCommands(this.client.user.id, guildId), {
                    body: [],
                });
            }
        }

        this.client.warn("Cleared all commands.");
    };

    afterInit = async (): Promise<void> => {
        this.REST.setToken(this.client.config.credentials.discordToken);

        await this.loadCommandFiles("build/commands");

        if (this.client.redeployCommands) {
            await this.clearCommands();
            await this.deployCommands();
        }
    };
}
