import { readdirSync } from "fs";

import { TundraBot } from "../base/TundraBot";
import { Command } from "../base/Command";
import Logger from "../utils/logger";
import Deps from "../utils/deps";

export default async (client: TundraBot): Promise<void> => {
    const dirs = readdirSync(__dirname + "/../commands/");
    for (const dir of dirs) {
        const commands = readdirSync(`${__dirname}/../commands/${dir}`);

        // For every command
        for (const file of commands) {
            await loadCommand(client, dir, file);
        }
    }
};

export async function loadCommand(client: TundraBot, commandCategory: string, commandName: string): Promise<boolean> {
    try {
        const { default: Command } = await import(`../commands/${commandCategory}/${commandName}`);
        Deps.build(Command);
        const command: Command = Deps.get(Command);

        if (command.enabled) {
            client.commands.set(command.name, command);
            Logger.log("ready", `Loaded command: ${command.name}`);
        } else {
            Logger.log("warn", `Tried loading disabled command: ${command.name}`);
            Deps.removeCommand(command.name);
            return false;
        }
        
        // If there are any aliases for the command
        if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach((alias) =>
                client.aliases.set(alias, command.name)
            );
        }

        return true;
    } catch (err) {
        Logger.log("error", `Unable to load command ${commandName}: ${err}`);
        return false;
    }
}

export async function unloadCommand(client: TundraBot, commandCategory: string, commandName: string): Promise<boolean> {
    try {
        let command: Command;
        if (client.commands.has(commandName)) {
            command = client.commands.get(commandName);
        } else if (client.aliases.has(commandName)) {
            command = client.commands.get(client.aliases.get(commandName));
        }
        if (!command) return false;

        if (command.shutdown) {
            await command.shutdown();
        }

        client.commands.delete(command.name);
        if (command.aliases) {
            for (const alias of command.aliases) {
                client.aliases.delete(alias);
            }
        }
        Deps.removeCommand(command.name);

        delete require.cache[require.resolve(`../commands/${commandCategory}/${command.name}.js`)];

        Logger.log("info", `Unloaded command: ${commandName}`);

        return true;
    } catch (err) {
        Logger.log("error", `Unable to unload command ${commandName}: ${err}`);
        return false;
    }
}
