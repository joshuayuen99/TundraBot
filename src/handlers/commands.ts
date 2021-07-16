import { readdirSync } from "fs";

import { default as ascii } from "ascii-table";
import { TundraBot } from "../base/TundraBot";
import { Command } from "../base/Command";
import Logger from "../utils/logger";
import Deps from "../utils/deps";
const table = new ascii().setHeading("Command", "Load status");

export default async (client: TundraBot): Promise<void> => {
    const dirs = readdirSync("./src/commands/");
    for (const dir of dirs) {
        // Gets all .ts "commands"
        const commands = readdirSync(`./src/commands/${dir}`).filter((f) =>
            f.endsWith(".ts")
        );

        // For every .ts "command"
        for (const file of commands) {
            const { default: Command } = await import(`../commands/${dir}/${file}`);
            Deps.build(Command);
            const command: Command = Deps.get(Command);

            if (command.enabled) {
                // Name of the command
                client.commands.set(command.name, command);
                table.addRow(command.name, "\u2714");
            } else {
                // If there is no command name specified
                table.addRow(command.name, "\u2716");
                continue;
            }
            
            // If there are any aliases for the command
            if (command.aliases && Array.isArray(command.aliases)) {
                command.aliases.forEach((alias) =>
                    client.aliases.set(alias, command.name)
                );
            }
        }
    }
    Logger.log("ready", "\n" + table.toString());
};
