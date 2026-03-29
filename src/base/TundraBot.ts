import { Client, GatewayIntentBits } from "discord.js";
import { loadEventHandlers } from "../loaders/events.ts";

export class TundraBot {
    client: Client;

    constructor() {
        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });

        loadEventHandlers(this.client);
    }

    async login(token: string) {
        this.client.login(token);
    }
}
