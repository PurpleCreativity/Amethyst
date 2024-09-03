import { type ButtonInteraction, REST, Collection, Routes } from "discord.js";
import type SuperClient from "../classes/SuperClient.js";
import fs from "node:fs"
import path from "node:path"
import SlashCommand from "../classes/SlashCommand.js";
import type StaticButton from "../classes/StaticButton.js";

export default class Interactables {
    client: SuperClient;

    REST: REST

    StoredCommands = new Collection<string, SlashCommand>();
	StaticButtons = new Map<string, StaticButton>();

    constructor(client: SuperClient) {
        this.client = client;
    }

    AddCommand = (command : SlashCommand) => {
		this.StoredCommands.set(command.name, command)
	}

	RemoveCommand = async (commandName : string) => {
		this.StoredCommands.delete(commandName)
	}

	GetCommand = (commandName : string) => {
		return this.StoredCommands.get(commandName)
	}

    LoadCommandFiles = async () => {
		for (const folder of fs.readdirSync(path.join(process.cwd(), "build/commands"))) {
			const newPath = path.join(process.cwd(), "build/commands", folder)
			const files = fs.readdirSync(newPath).filter(file => file.endsWith(".js"))
			for (const file of files) {
				const importPath = path.join(process.cwd(), "build/commands", folder, file)
				const commands = await import(`file://${importPath}`).then(res => res.default);
				const routesCommands = Array.isArray(commands) ? commands : [commands];

				for (const command of routesCommands) {
					if (!(command instanceof SlashCommand)) {
						this.client.warn("Command that is not a command, skipping")
						continue;
					}
					
					this.AddCommand(command)
				}
			}
		}
	}

    DeleteCommands = async () => {
		await this.REST.put(
			Routes.applicationCommands(this.client.application?.id as string),
			{
				body: []
			}
		)

		for (const guild of this.client.guilds.cache.values()) {
			await this.REST.put(
				Routes.applicationGuildCommands(this.client.application?.id as string, guild.id),
				{
					body: []
				}
			)
		}

		this.client.warn("Deleted all commands")
	}

	DeployCommands = async () => {
		if (!this.client.application) throw new Error("No application(????????????)")
		
		this.client.warn("Deploying commands")
		await this.REST.put(
			Routes.applicationCommands(this.client.application.id),
			{
				body: this.StoredCommands.map((command) => {
					if (!(command instanceof SlashCommand)) {
						this.client.warn("Command that is not a command, skipping")
						return;
					}

					return command.toJSON()
				})
			}
		);

		this.client.success("Finished deploying commands")
	}

    AddStaticButton = (StaticButton : StaticButton) => {
		this.StaticButtons.set(StaticButton.customId, StaticButton)
	}

	GetStaticButton = (customId : string) => {
		return this.StaticButtons.get(customId)
	}

    LoadStaticButtons = async () => {
		const buttons = fs.readdirSync(path.join(process.cwd(), "build/staticButtons")).filter(file => file.endsWith(".js"))
		for (const button of buttons) {
			const buttonData = await import(`file://${path.join(process.cwd(), "build/staticButtons", button)}`)
			this.AddStaticButton(buttonData.default)
		}
	}

    Init = async () => {
        this.REST = new REST().setToken(this.client.config.credentials.discordToken);

        await this.LoadCommandFiles()
        await this.LoadStaticButtons()

        if (this.client.redeployCommands) {
            this.client.warn("Reloading commands")
            await this.DeleteCommands()
            await this.DeployCommands()
        }

        this.client.success("Initialized Commands");
    }
}