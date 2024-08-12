import type { ButtonInteraction, Interaction, ModalSubmitInteraction, SelectMenuInteraction } from "discord.js";
import type SuperClient from "../classes/SuperClient.js";

export default class Process {
    client: SuperClient;

    constructor(client: SuperClient) {
        this.client = client;
    }

    Error = async (error: Error) => {
        try {
            //this.client.Logs.LogError(error);
            this.client.error(error.stack);
            this.client.error(error.name);
            this.client.error(error.message);
            this.client.error(error);
        } catch (error) {
            this.client.error(error);
        }
    }

    handleStaticButton = async (interaction: ButtonInteraction) => {
        const args = interaction.customId.split("_");
        args.shift();
        if (!args.length || args.length === 0) return;

        const button = this.client.Interactables.StaticButtons.get(args[0].toLowerCase());
        if (!button) return;

        await button.Execute(interaction);
    }

    interactionCreate = async (interaction: Interaction) => {
        if (interaction.isChatInputCommand()) {
            const command = this.client.Interactables.GetCommand(interaction.commandName);
            if (!command) return;

            await command.Execute(interaction);
            return;
        }

        if (interaction.isButton()) {
            if (interaction.customId.toLowerCase().startsWith("static_")) {
                this.handleStaticButton(interaction as ButtonInteraction);
                return;
            }

            this.client.emit("buttonPress", interaction as ButtonInteraction);
            return;
        }

        if (interaction.isModalSubmit()) {
            this.client.emit("modalSubmit", interaction as ModalSubmitInteraction);
            return;
        }

        if (interaction.isAutocomplete()) {
            const commandName = interaction.commandName;
            const command = this.client.Interactables.StoredCommands.get(commandName);

            if (!command || !command.autocomplete) return;

            const choices = await command.autocomplete(interaction) || [];
			if (choices.length > 25) {
				choices.splice(25);
			}
			await interaction.respond(choices);

            return;
        }

        if (interaction.isAnySelectMenu()) {
            this.client.emit("selectMenu", interaction as SelectMenuInteraction);
            return;
        }
    }

    Init = async () => {
        this.client.Events.AddEvent("client", "interactionCreate", this.interactionCreate);
        //this.client.Events.AddEvent("client", "guildCreate", this.guildCreate);

        this.client.Events.AddEvent("process", "uncaughtException", this.Error);

        this.client.success("Initialized Process");
    }
}