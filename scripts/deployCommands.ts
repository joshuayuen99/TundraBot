import { REST, Routes } from "discord.js";

import { slashCommands } from "../src/loaders/commands.ts";
import { Logger } from "../src/utils/Logger.ts";
import { Env, getEnv } from "../src/utils/loadEnvironmentVars.ts";

const rest = new REST().setToken(getEnv(Env.DISCORD_TOKEN));

(async () => {
    try {
        const argv = process.argv.slice(2);
        const guildId = argv[0] || getEnv(Env.SUPPORT_SERVER_ID);

        Logger.info(
            `Started refreshing ${slashCommands.length} application (/) commands.`
        );

        const slashCommandBuilders = slashCommands.map(
            (slashCommand) => slashCommand.slashCommand
        );

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = (await rest.put(
            Routes.applicationGuildCommands(getEnv(Env.BOT_ID), guildId),
            { body: slashCommandBuilders }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        )) as any[];

        Logger.info(
            `Successfully reloaded ${data.length} application (/) commands.`
        );
    } catch (err) {
        Logger.error(err, `Error refreshing application (/) commands: ${err}`);
    }
})();
