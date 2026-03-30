import { type Client } from "discord.js";
import { Logger } from "../utils/Logger.ts";
import type { SlashCommand } from "../base/Command.ts";
import Ping from "../commands/utility/ping.ts";
import Emoji from "../commands/utility/emoji.ts";

export const slashCommands: SlashCommand[] = [new Emoji(), new Ping()];

export function loadSlashCommands(client: Client) {
    for (const command of slashCommands) {
        client.slashCommands.set(command.slashCommand.name, command);
    }

    Logger.info(`Loaded ${slashCommands.length} commands!`);
}
