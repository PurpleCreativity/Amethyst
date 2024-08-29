import { ButtonStyle, type Guild } from "discord.js";
import type SuperClient from "../classes/SuperClient.js";
import ButtonEmbed from "../classes/ButtonEmbed.js";
import Emojis from "../assets/Emojis.js";

export default class Logs {
    client: SuperClient;

    constructor(client: SuperClient) {
        this.client = client;
    }

    LogError = async (error: Error) => {
        this.client.error(error.stack as string, true);
        if (!error.stack) return;

        const channel = this.client.BotChannels.errors;
        if (!channel) return;

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

        await channel.send({ embeds: [errorEmbed] });
    }

    guildCreate = async (guild: Guild) => {
        const channel = this.client.BotChannels.logs;
        if (!channel) return;

        const owner = await guild.fetchOwner().then((owner) => owner.user);
        const inviteLinks = await guild.invites.fetch();

        const inviteLinksFormatted = inviteLinks.map(invite => `[${invite.code}](https://discord.gg/${invite.code})`).join("\n");

        const baseEmbed = this.client.Functions.makeInfoEmbed({
            title: "Guild joined",
            description: "The bot has joined a new guild",
            footer: { text: owner.username, iconURL: owner.displayAvatarURL() },
            image: guild.bannerURL() || undefined,
            thumbnail: guild.iconURL() || undefined,
        })

        baseEmbed.setFields([{
            name: "Guild",
            value: `Name: \`${guild.name}\`\nId: \`${guild.id}\``
        },
        {
            name: `Invite Links (${inviteLinks.size})`,
            value: inviteLinksFormatted
        },
        {
            name: "Owner",
            value: `Name: \`${owner.username}\`\nId: \`${owner.id}\`\n(<@${owner.id}>)`
        }])

        const buttonEmbed = new ButtonEmbed(baseEmbed)

        buttonEmbed.addButton({
            label: "Leave Guild",
            style: ButtonStyle.Danger,
            emoji: Emojis.delete,
            allowedUsers: this.client.config.devList,

            function: async (buttonInteraction) => {
                await guild.leave();
                baseEmbed.setColor(0xff0000)
                baseEmbed.setTitle("(Force left)");

                buttonInteraction.update({ embeds: [baseEmbed], components: [] });
            }
        });

        await channel.send(buttonEmbed.getMessageData());
    }

    Init = async () => {
        this.client.success("Initialized Logs");
    }
}