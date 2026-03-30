import { Client, Collection, GatewayIntentBits } from "discord.js";
import { loadEventHandlers } from "../loaders/events.ts";
import { loadSlashCommands } from "../loaders/commands.ts";
import type { SlashCommand } from "./Command.ts";

export class TundraBot {
    client: Client;

    constructor() {
        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });

        this.client.slashCommands = new Collection();
        loadSlashCommands(this.client);

        loadEventHandlers(this.client);
    }

    async login(token: string) {
        this.client.login(token);
    }
}

declare module "discord.js" {
    export interface Client {
        slashCommands: Collection<string, SlashCommand>;
    }
}
