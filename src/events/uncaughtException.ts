import Event from "../classes/Event.ts";

export default new Event({
    type: "process",
    callback: (client, error) => {
        if (!(error instanceof Error)) return;

        client.error(error.stack);
    },
});
