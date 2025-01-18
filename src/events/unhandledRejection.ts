import Event from "../classes/Event.js";

export default new Event({
    type: "process",
    listener: (reason, promise) => {
        console.error("Unhandled Rejection:", reason);
    },
});
