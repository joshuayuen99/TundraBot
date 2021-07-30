import { readdirSync } from "fs";

import { default as ascii } from "ascii-table";
import { TundraBot } from "../base/TundraBot";
import Logger from "../utils/logger";
import Deps from "../utils/deps";
import { EventHandler } from "../base/EventHandler";
const table = new ascii().setHeading("Event", "Load status");

export default async (client: TundraBot): Promise<void> => {
    const handlerFiles = readdirSync(__dirname + "/../events/");
    for (const file of handlerFiles) {
        const {default: Handler} = await import(`../events/${file}`);
        Deps.buildWithClient(client, Handler);
        const handler: EventHandler = Deps.get(Handler);

        const eventName = file.split(".")[0];
        if (eventName) {
            // Name of the event
            client.on(eventName, handler.invoke.bind(handler));
            table.addRow(eventName, "\u2714");
        } else {
            // If there is no event name specified
            table.addRow(eventName, "\u2716");
            return;
        }
    }
    Logger.log("ready", "\n" + table.toString());
};
