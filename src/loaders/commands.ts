import { type Client } from "discord.js";
import type { SlashCommand } from "../base/Command.ts";
import Emoji from "../commands/utility/emoji.ts";
import Ping from "../commands/utility/ping.ts";
import { Logger } from "../utils/Logger.ts";

export const slashCommands: SlashCommand[] = [new Emoji(), new Ping()];

export function loadSlashCommands(client: Client) {
    for (const command of slashCommands) {
        client.slashCommands.set(command.slashCommand.name, command);

        for (const customId of command.buttonInteractionCustomIds) {
            client.buttonInteractionHandlers.set(customId, command);
        }
    }

    Logger.info(`Loaded ${slashCommands.length} commands!`);
}
