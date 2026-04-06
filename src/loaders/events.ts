import type { Client } from "discord.js";

import type { EventHandler } from "../base/EventHandler.ts";
import ReadyHandler from "../events/ClientReady.ts";
import InteractionCreateHandler from "../events/InteractionCreate.ts";
import { Logger } from "../utils/Logger.ts";

export function loadEventHandlers(client: Client) {
    const eventHandlers: EventHandler[] = [
        new InteractionCreateHandler(),
        new ReadyHandler(),
    ];

    for (const eventHandler of eventHandlers) {
        if (eventHandler.once) {
            client.once(
                eventHandler.event,
                eventHandler.handle.bind(eventHandler)
            );
        } else {
            client.on(
                eventHandler.event,
                eventHandler.handle.bind(eventHandler)
            );
        }
    }

    Logger.info(`Loaded ${eventHandlers.length} events!`);
}
