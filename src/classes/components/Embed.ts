import { type APIEmbed, type APIEmbedField, type ColorResolvable, EmbedBuilder } from "discord.js";

/**
 * Options for configuring an Embed.
 */
export type EmbedOptions = {
    /** The title of the embed. */
    title?: string;

    /** The URL that the title links to. */
    url?: string;

    /** The description of the embed. */
    description?: string;

    /** The color of the embed. */
    color?: ColorResolvable;

    /** A timestamp to include in the embed. */
    timestamp?: Date | number;

    /** The URL of the thumbnail image. */
    thumbnail?: string;

    /** The URL of the main image. */
    image?: string;

    /** The author information for the embed. */
    author?: {
        /** The name of the author. */
        name: string;

        /** The URL of the author's icon. */
        iconURL?: string;

        /** A URL associated with the author. */
        url?: string;
    };

    /** The footer information for the embed. */
    footer?: {
        /** The text of the footer. */
        text: string;

        /** The URL of the footer icon. */
        iconURL?: string;
    };

    /** An array of fields to include in the embed. */
    fields?: APIEmbedField[];
};

/**
 * A utility wrapper for creating and managing Discord embeds.
 */
export default class Embed extends EmbedBuilder {
    /**
     * Creates a new Embed instance.
     *
     * @param {EmbedOptions} options - The options to initialize the embed.
     */
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

    /**
     * Retrieves a field by its name.
     *
     * @param {string} name - The name of the field to retrieve.
     * @returns {APIEmbedField | null} The matching field or `null` if not found.
     */
    getField(name: string): APIEmbedField | null {
        return this.data.fields?.find((field: APIEmbedField) => field.name === name) || null;
    }

    /**
     * Adds a new field to the embed.
     *
     * @param {string} name - The name of the field.
     * @param {string} value - The value of the field.
     * @param {boolean} inline - Whether the field should be inline.
     */
    addField(name: string, value: string, inline: boolean): void {
        this.addFields({ name, value, inline });
    }

    /**
     * Removes a field by its name.
     *
     * @param {string} name - The name of the field to remove.
     */
    removeField(name: string): void {
        const field = this.getField(name);
        if (!field) return;

        this.data.fields?.splice(this.data.fields.indexOf(field), 1);
    }

    /**
     * Updates or adds a field to the embed.
     *
     * @param {string} name - The name of the field.
     * @param {string} value - The **new** value of the field.
     * @param {boolean} inline - Whether the field should **now** be inline.
     */
    setField(name: string, value: string, inline: boolean): void {
        const field = this.getField(name);

        if (field) {
            field.value = value;
            field.inline = inline;
        } else {
            this.addField(name, value, inline);
        }
    }

    /**
     * Populates the embed's properties from a JSON object or string.
     *
     * @param {string | APIEmbed} json - The JSON string or object to populate the embed.
     * @returns {this} The updated Embed instance.
     */
    fromJSON(json: string | APIEmbed): this {
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
    }
}
