import { Client, Collection, GatewayIntentBits } from "discord.js";

import { loadSlashCommands } from "../loaders/commands.ts";
import { loadEventHandlers } from "../loaders/events.ts";
import type { SlashCommand } from "./Command.ts";

export class TundraBot {
    client: Client;

    constructor() {
        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });

        this.client.slashCommands = new Collection();
        this.client.buttonInteractionHandlers = new Collection();
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
        /** Collection<customId, SlashCommand> */
        buttonInteractionHandlers: Collection<string, SlashCommand>;
    }
}
