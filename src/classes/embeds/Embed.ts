import { type APIEmbed, type APIEmbedField, type ColorResolvable, EmbedBuilder } from "discord.js";

export type EmbedOptions = {
    title?: string;
    url?: string;

    description?: string;

    color?: ColorResolvable;
    timestamp?: Date | number;

    thumbnail?: string;
    image?: string;

    author?: { name: string; iconURL?: string; url?: string };
    footer?: { text: string; iconURL?: string };

    fields?: APIEmbedField[];
};

export default class Embed extends EmbedBuilder {
    constructor(options: EmbedOptions) {
        super();

        this.setTitle(options.title || null);
        this.setURL(options.url || null);

        this.setDescription(options.description || null);

        this.setColor(options.color || null);
        this.setTimestamp(options.timestamp || null);

        this.setThumbnail(options.thumbnail || null);
        this.setImage(options.image || null);

        this.setAuthor(options.author || null);
        this.setFooter(options.footer || null);

        this.setFields(options.fields || []);
    }

    getField = (name: string): APIEmbedField | null => {
        return this.data.fields?.find((field: APIEmbedField) => field.name === name) || null;
    };

    addField = (name: string, value: string, inline = false): void => {
        this.addFields({ name, value, inline });
    };

    removeField = (name: string): void => {
        const field = this.getField(name);
        if (!field) return;

        this.data.fields?.splice(this.data.fields.indexOf(field), 1);
    };

    updateField = (name: string, value: string, inline = false): void => {
        const field = this.getField(name);

        if (field) {
            field.value = value;
            field.inline = inline;
        } else {
            this.addField(name, value, inline);
        }
    };

    fromJSON = (json: string | APIEmbed): this => {
        const data: APIEmbed = typeof json === "string" ? JSON.parse(json) : json;

        this.setTitle(data.title || null);
        this.setURL(data.url || null);
        this.setDescription(data.description || null);
        this.setColor(data.color || null);
        this.setTimestamp(data.timestamp ? new Date(data.timestamp) : null);
        this.setThumbnail(data?.thumbnail?.url || null);
        this.setImage(data?.image?.url || null);
        this.setAuthor(data.author || null);
        this.setFooter(data.footer || null);
        this.setFields(data.fields || []);

        return this;
    };
}