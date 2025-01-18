import Event from "../classes/Event.js";
import client from "../main.js";

export default new Event({
    type: "process",
    listener: (error) => {
        if (!(error instanceof Error)) return;

        client.error(error.stack);
    },
});
