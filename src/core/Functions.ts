//! Rewrite

import { Buffer } from "node:buffer";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import process from "node:process";
import { Colors, Message, type StartThreadOptions, type TextChannel } from "discord.js";
import Icons from "../../public/Icons.json" with { type: "json" };
import type Client from "../classes/Client.ts";
import Embed, { type EmbedOptions } from "../classes/Embed.js";

export default class Functions {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }
    /*
  GetRobloxUser = async (searcher: string | number, useCache = true) => {
    if (typeof searcher === "number") {
      try {
        return await this.client.Wrapblox.fetchUser(searcher, useCache);
      } catch (_error) {
        return undefined;
      }
    }

    if (typeof searcher === "string") {
      if (!Number.isNaN(Number.parseInt(searcher))) {
        try {
          return await this.client.Wrapblox.fetchUser(Number.parseInt(searcher), useCache);
        } catch (_error) {
          return undefined;
        }
      }

      try {
        return await this.client.Wrapblox.fetchUserByName(searcher, useCache);
      } catch (_error) {
        return undefined;
      }
    }
  };
*/
    GenerateID = () => {
        return crypto.randomUUID();
    };

    GenerateIV = () => {
        return randomBytes(16).toString("hex");
    };

    MemoryUsage = () => {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        return Math.round(used);
    };

    CreateAcronym = (string: string) => {
        // Removes all non-uppercase letters
        return string.replace(/[^A-Z]/g, "");
    };

    ConvertPlaceIDToUniverseID = async (placeID: number) => {
        const response = await this.client.Axios.get(`https://apis.roblox.com/universes/v1/places/${placeID}/universe`);
        return response.data.universeId;
    };

    TrueStrings = ["true", "yes", "1", "on"];
    FalseStrings = ["false", "no", "0", "off"];
    StringToBoolean = (string: string) => {
        if (this.TrueStrings.includes(string.toLowerCase())) return true;
        if (this.FalseStrings.includes(string.toLowerCase())) return false;
        return false;
    };

    StringRGBToColorHex = (string: string) => {
        const rgb = string.split(",");
        if (rgb.length !== 3) {
            throw new Error(
                "Invalid RGB input. RGB input should have exactly 3 values between 0 and 255 separated by commas.",
            );
        }
        const hex = rgb.map((value) => {
            const intValue = Number.parseInt(value.trim(), 10);
            if (Number.isNaN(intValue) || intValue < 0 || intValue > 255) {
                throw new Error("Invalid RGB input. Each value should be an integer between 0 and 255.");
            }
            const hexValue = intValue.toString(16).padStart(2, "0");
            return hexValue;
        });
        const hexColor = `#${hex.join("")}`;
        return hexColor;
    };

    GetColor = (string: string) => {
        if (string.startsWith("#") || string.startsWith("0x")) return string;

        const isRGB = /^\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*$/.test(string);
        if (isRGB) {
            return this.StringRGBToColorHex(string);
        }

        for (const color of Object.keys(Colors)) {
            if (color.toLowerCase() === string.toLowerCase()) {
                const colorValue = (Colors as Record<string, number>)[color];
                return `#${colorValue.toString(16).padStart(6, "0")}`;
            }
        }

        return undefined;
    };

    Encypt = (text: string, iv: string) => {
        const key = Buffer.from(this.client.config.credentials.encryptionKey, "hex");
        const _iv = Buffer.from(iv, "hex");

        const cipher = createCipheriv("aes256", key, _iv);
        const encryptedMessage = cipher.update(text, "utf8", "hex") + cipher.final("hex");

        return encryptedMessage;
    };

    Decrypt = (text: string, iv: string) => {
        const key = Buffer.from(this.client.config.credentials.encryptionKey, "hex");
        const _iv = Buffer.from(iv, "hex");

        const decipher = createDecipheriv("aes256", key, _iv);
        const decryptedMessage = decipher.update(text, "hex", "utf-8") + decipher.final("utf8");

        return decryptedMessage;
    };

    isDev = (userId: string) => {
        return this.client.config.devList.includes(userId);
    };

    makeInfoEmbed = (options: EmbedOptions) => {
        const embed = new Embed(options);
        if (!options.color) embed.setColor(0x4287f5);
        if (!options.author) {
            embed.setAuthor({ name: "Info", iconURL: Icons.info });
        }

        return embed;
    };

    makeWarnEmbed = (options: EmbedOptions) => {
        const embed = new Embed(options);
        if (!options.color) embed.setColor(0xffcc00);
        if (!options.author) {
            embed.setAuthor({ name: "Warning", iconURL: Icons.warn });
        }

        return embed;
    };

    makeSuccessEmbed = (options: EmbedOptions) => {
        const embed = new Embed(options);
        if (!options.color) embed.setColor(0x00ff00);
        if (!options.author) {
            embed.setAuthor({ name: "Success", iconURL: Icons.check });
        }

        return embed;
    };

    makeErrorEmbed = (options: EmbedOptions) => {
        const embed = new Embed(options);
        if (!options.color) embed.setColor(0xff0000);
        if (!options.author) {
            embed.setAuthor({ name: "Error", iconURL: Icons.close });
        }

        return embed;
    };

    startThread = async (starter: Message | TextChannel, options: StartThreadOptions) => {
        if (starter instanceof Message) {
            return await starter.startThread(options);
        }

        return await starter.threads.create(options);
    };
}
