import { type ColorResolvable, type APIEmbedField, EmbedBuilder } from "discord.js"

export type EmbedOptions = {
	title?: string,
	url?: string,

	description?: string,

	color?: ColorResolvable,
    timestamp?: Date | number,

	thumbnail?: string,
	image?: string,

	author?: { name: string, iconURL?: string, url?: string },
    footer?: { text: string, iconURL?: string }

	fields?: APIEmbedField[],
}

export default class BaseEmbed extends EmbedBuilder {
    constructor(options: EmbedOptions) {
        super()
        this.setTitle(options.title || null)
		this.setURL(options.url || null)

        this.setDescription(options.description || null)

        this.setColor(options.color || null)
        this.setTimestamp(options.timestamp || null)

        this.setThumbnail(options.thumbnail || null)
        this.setImage(options.image || null)

        this.setAuthor(options.author || null)
        this.setFooter(options.footer || null)

        this.setFields(options.fields || [])
    }

    UpdateField(name : string, value : string, inline? : boolean) {
		if (!this.data.fields) return;
		const index = this.data.fields.findIndex(f => f.name === name);
		if (!index) return;
		this.data.fields[index].value = value;
		if (inline !== undefined) this.data.fields[index].inline = inline;
	}
	
	GetField(name : string) {
		if (!this.data.fields) return;
		return this.data.fields.find(f => f.name === name);
	}
	
	addField(name : string, value : string, inline? : boolean) {
		this.addFields({ name, value, inline });
		return this;
	}
}