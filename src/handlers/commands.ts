import { readdirSync } from "fs";

import { TundraBot } from "../base/TundraBot";
import { Command } from "../base/Command";
import Logger from "../utils/logger";
import Deps from "../utils/deps";
import { ApplicationCommandData } from "discord.js";

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

export async function registerInteractiveCommands(
    client: TundraBot
): Promise<boolean> {
    const dirs = readdirSync(__dirname + "/../commands/");
    
    const commandLocations: CommandLocation[] = [];
    for (const dir of dirs) {
        const commands = readdirSync(`${__dirname}/../commands/${dir}`);

        // For every command
        for (const file of commands) {
            commandLocations.push({commandCategory: dir, commandName: file});
        }
    }

    return await loadInteractiveCommands(client, commandLocations);
}

export async function loadCommand(
    client: TundraBot,
    commandCategory: string,
    commandName: string
): Promise<boolean> {
    try {
        const { default: Command } = await import(
            `../commands/${commandCategory}/${commandName}`
        );

        let command: Command = Deps.get(Command);
        if (!command) {
            Deps.build(Command);
            command = Deps.get(Command);
        }

        let commandLoaded = false;
        if (command.enabled) {
            client.commands.set(command.name, command);

            // If there are any aliases for the command
            if (command.aliases && Array.isArray(command.aliases)) {
                command.aliases.forEach((alias) =>
                    client.aliases.set(alias, command.name)
                );
            }

            commandLoaded = true;
            Logger.log("ready", `Loaded command: ${command.name}`);
        }
        if (!commandLoaded) {
            // Logger.log("warn", `Tried loading disabled command: ${command.name}`);

            if (!command.enabled && !command.slashCommandEnabled)
                Deps.removeCommand(command.name);
        }

        return commandLoaded;
    } catch (err) {
        Logger.log("error", `Unable to load command ${commandName}: ${err}`);
        return false;
    }
}

export interface CommandLocation {
    commandCategory: string;
    commandName: string;
}

export async function loadInteractiveCommands(
    client: TundraBot,
    commandLocations: CommandLocation[]
): Promise<boolean> {
    if (commandLocations.length === 0) return false;

    // single interactive command
    if (commandLocations.length === 1) {
        const commandLocation = commandLocations[0];
        try {
            const { default: Command } = await import(
                `../commands/${commandLocation.commandCategory}/${commandLocation.commandName}`
            );

            let command: Command = Deps.get(Command);
            if (!command) {
                Deps.build(Command);
                command = Deps.get(Command);
            }

            const data = {
                name: command.name,
                description: command.slashDescription,
                options: command.commandOptions,
            } as ApplicationCommandData;

            if (command.slashCommandEnabled) {
                if (process.env.TESTING === "true") {
                    await client.guilds.cache
                        .get(process.env.SUPPORT_SERVER_ID)
                        ?.commands.create(data);
                } else {
                    await client.application?.commands.create(data);
                }

                client.interactiveCommands.set(command.name, command);

                Logger.log(
                    "ready",
                    `Loaded interactive command: ${command.name}`
                );
                return true;
            } else {
                // Logger.log("warn", `Tried loading disabled interactive command: ${command.name}`);

                if (!command.enabled && !command.slashCommandEnabled)
                    Deps.removeCommand(command.name);

                return false;
            }
        } catch (err) {
            Logger.log(
                "error",
                `Unable to load interactive command ${commandLocation.commandName}: ${err}`
            );
            return false;
        }
    }

    // multiple interactive commands
    const interactiveCommands: Command[] = [];
    for (const commandLocation of commandLocations) {
        try {
            const { default: Command } = await import(
                `../commands/${commandLocation.commandCategory}/${commandLocation.commandName}`
            );

            let command: Command = Deps.get(Command);
            if (!command) {
                Deps.build(Command);
                command = Deps.get(Command);
            }

            if (command.slashCommandEnabled) {
                interactiveCommands.push(command);
            } else {
                // Logger.log("warn", `Tried loading disabled interactive command: ${command.name}`);

                if (!command.enabled && !command.slashCommandEnabled) {
                    Deps.removeCommand(command.name);
                }
            }
        } catch (err) {
            Logger.log(
                "error",
                `Unable to load interactive command ${commandLocation.commandName}: ${err}`
            );
            return false;
        }
    }

    // all commands we tried loading are disabled
    if (interactiveCommands.length === 0) return false;

    // all commands but 1 we tried loading are disabled
    if (interactiveCommands.length === 1) {
        try {
            const interactiveCommand = interactiveCommands[0];

            const data = {
                name: interactiveCommand.name,
                description: interactiveCommand.slashDescription,
                options: interactiveCommand.commandOptions,
            } as ApplicationCommandData;

            if (process.env.TESTING === "true") {
                await client.guilds.cache
                    .get(process.env.SUPPORT_SERVER_ID)
                    ?.commands.create(data);
            } else {
                await client.application?.commands.create(data);
            }

            client.interactiveCommands.set(interactiveCommand.name, interactiveCommand);

            Logger.log("ready", `Loaded interactive command: ${interactiveCommand.name}`);
            return true;
        } catch (err) {
            const interactiveCommand = interactiveCommands[0];
            Logger.log(
                "error",
                `Unable to load interactive command ${interactiveCommand.name}: ${err}`
            );

            // remove dependency if it's not regularly enabled
            if (!interactiveCommand.enabled) {
                Deps.removeCommand(interactiveCommand.name);
            }

            return false;
        }
    }

    const interactiveCommandsData = interactiveCommands.map((interactiveCommand) => ({ name: interactiveCommand.name,
        description: interactiveCommand.slashDescription,
        options: interactiveCommand.commandOptions, } as ApplicationCommandData));

    try {
        if (process.env.TESTING === "true") {
            await client.guilds.cache
                .get(process.env.SUPPORT_SERVER_ID)
                ?.commands.set(interactiveCommandsData);
        } else {
            await client.application?.commands.set(interactiveCommandsData);
        }
    } catch (err) {
        Logger.log(
            "error",
            `Unable to load interactive commands [${interactiveCommands.map((interactiveCommands) => interactiveCommands.name).join(", ")}]: ${err}`
        );

        for (const interactiveCommand of interactiveCommands) {
            client.interactiveCommands.delete(interactiveCommand.name);
        }

        return false;
    }

    // try registering multiple interactive commands
    for (const interactiveCommand of interactiveCommands) {
        client.interactiveCommands.set(interactiveCommand.name, interactiveCommand);
    }

    Logger.log(
        "ready",
        `Registered ${interactiveCommands.length} interactive commands [${interactiveCommands.map((interactiveCommands) => interactiveCommands.name).sort().join(", ")}]`
    );

    return true;
}

export async function unloadCommand(
    client: TundraBot,
    commandCategory: string,
    commandName: string
): Promise<boolean> {
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

        delete require.cache[
            require.resolve(`../commands/${commandCategory}/${command.name}.js`)
        ];

        Logger.log("info", `Unloaded command: ${commandName}`);

        return true;
    } catch (err) {
        Logger.log("error", `Unable to unload command ${commandName}: ${err}`);
        return false;
    }
}
