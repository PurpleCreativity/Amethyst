import rateLimit from "express-rate-limit";
import Route from "../../../../classes/Route.js";
import client from "../../../../index.js";
import type { TextChannel } from "discord.js";
import type { EmbedBuilder } from "@discordjs/builders";

export default new Route({
    path: "guild/channels/:channelType/send",
    method: "POST",

    public: false,
    permissions: ["Moderation"],

    rateLimit: rateLimit({
		windowMs: 1 * 60 * 1000,
		limit: 120,
		standardHeaders: 'draft-6',
		legacyHeaders: true,

		handler: (req, res) => {
			return client.API.rateLimitHandler(req, res);
		},
	}),

    execute: async (req, res, guildProfile) => {
        if (!guildProfile) return res.status(404).send({ error: "Guild Profile Not Found", message: "The guild profile could not be found" }).end();

        const channel = await guildProfile.getChannel(req.params.channelType) as TextChannel;
        if (!channel) return res.status(404).send({ error: "Channel Not Found", message: "The channel could not be found or is not set" }).end();

        const messagePayload = { content: undefined, embeds: [] as EmbedBuilder[] };
        if (req.body.content) messagePayload.content = req.body.content;
        if (req.body.embeds) {
            for (const embedData of req.body.embeds) {
                const actualEmbed = client.Functions.makeInfoEmbed({});

                if (embedData.title) actualEmbed.setTitle(embedData.title);
                if (embedData.description) actualEmbed.setDescription(embedData.description);
                if (embedData.color) actualEmbed.setColor(embedData.color);
                if (embedData.timestamp) actualEmbed.setTimestamp(embedData.timestamp);
                if (embedData.footer) actualEmbed.setFooter(embedData.footer);
                if (embedData.thumbnail) actualEmbed.setThumbnail(embedData.thumbnail);
                if (embedData.image) actualEmbed.setImage(embedData.image);
                if (embedData.author) actualEmbed.setAuthor(embedData.author);
                if (embedData.fields) {
                    for (const field of embedData.fields) {
                        actualEmbed.addField(field.name, field.value, field.inline);
                    }
                }

                messagePayload.embeds.push(actualEmbed);
            }
        }

        try {
            await channel.send(messagePayload);
            return res.status(200).send("OK").end();
        } catch (error) {
            return res.status(500).send({ error: { name: "Error while sending message", message: "An error occured while sending the message" } }).end();
        }
    }
})