import type SuperClient from "../classes/SuperClient.js";

export default class Logs {
    client: SuperClient;

    constructor(client: SuperClient) {
        this.client = client;
    }

    LogError = async (error: Error) => {
        this.client.error(error.stack as string, true);
        console.count("got here")
        if (!error.stack) return;

        console.count("got here")

        console.log(this.client.BotChannels);
        const channel = this.client.BotChannels.errors;
        if (!channel) return;

        console.count("got here")

        if (error.stack.length > 1024) {
            error.stack = error.stack.slice(0, 1024);
        }

        const matchString = process.cwd().replace(/\\/g, "\\\\");

        const matcher = new RegExp(matchString, "g");
        error.stack = error.stack.replace(matcher, "");

        if (error.stack.length > 980) {
            error.stack = error.stack.slice(0, 980);
            error.stack += "\nError stack too long!"
        }

        const errorEmbed = this.client.Functions.makeErrorEmbed({
            title: "An error occurred",
            fields: [
                {
                    name: "Error Message",
                    value: `\`\`\`js\n${error.message}\`\`\``,
                    inline: false
                },
                {
                    name: "Error Stack",
                    value: `\`\`\`js\n${error.stack}\`\`\``,
                    inline: false
                }
            ]
        })

        console.count("got here")

        await channel.send({ embeds: [errorEmbed] });
    }

    Init = async () => {
        this.client.success("Initialized Logs");
    }
}