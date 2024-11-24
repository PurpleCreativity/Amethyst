import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type Client from "../classes/Client.ts";

export default class CLI {
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    Init = async () => {};
}
