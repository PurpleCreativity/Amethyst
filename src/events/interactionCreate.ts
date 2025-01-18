import { BaseInteraction, MessageFlags } from "discord.js";
import Event from "../classes/Event.js";

export default new Event({
    type: "client",
    listener: async (interaction) => {
        if (!(interaction instanceof BaseInteraction)) return;
    },
});
