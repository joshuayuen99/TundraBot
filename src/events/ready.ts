import { Client, Events } from "discord.js";
import { type EventHandler } from "../base/EventHandler.ts";
import { Logger } from "../utils/Logger.ts";

export default class ReadyHandler implements EventHandler {
    readonly event = Events.ClientReady;
    readonly once = true;

    async handle(client: Client<true>): Promise<void> {
        Logger.info(`Ready! Logged in as ${client.user.tag}`);
    }
}
