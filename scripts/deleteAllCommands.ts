import { REST, Routes } from "discord.js";

import { Logger } from "../src/utils/Logger.ts";
import { Env, getEnv } from "../src/utils/loadEnvironmentVars.ts";

const rest = new REST().setToken(getEnv(Env.DISCORD_TOKEN));

(async () => {
    try {
        const argv = process.argv.slice(2);
        const guildId = argv[0] || getEnv(Env.SUPPORT_SERVER_ID);

        Logger.info(
            `Deleting all application (/) commands for guild: ${guildId}.`
        );

        // The put method is used to fully refresh all commands in the guild with the current set
        await rest.put(
            Routes.applicationGuildCommands(getEnv(Env.BOT_ID), guildId),
            {
                body: [],
            }
        );

        Logger.info(
            `Successfully deleted all application (/) commands for guild: ${guildId}.`
        );
    } catch (err) {
        Logger.error(err, `Error deleting application (/) commands: ${err}`);
    }
})();
