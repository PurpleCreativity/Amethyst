import type Client from "./Client.ts";

export type PluginOptions = {
  name: string;
  version: string;
  author: string;

  Init: (client: Client) => unknown | Promise<unknown>;
};

export default class Plugin {
  readonly name: string;
  readonly version: string;
  readonly author: string;

  readonly Init: (client: Client) => unknown | Promise<unknown>;

  constructor(options: PluginOptions) {
    this.name = options.name;
    this.version = options.version;
    this.author = options.author;

    this.Init = options.Init;
  }
}
