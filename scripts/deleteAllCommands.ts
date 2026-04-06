import { REST, Routes } from "discord.js";
import {
    BOT_ID,
    DISCORD_TOKEN,
    SUPPORT_SERVER_ID,
} from "../src/utils/loadEnvironmentVars.ts";
import { Logger } from "../src/utils/Logger.ts";

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
    try {
        const argv = process.argv.slice(2);
        const guildId = argv[0] || SUPPORT_SERVER_ID;

        Logger.info(
            `Deleting all application (/) commands for guild: ${guildId}.`
        );

        // The put method is used to fully refresh all commands in the guild with the current set
        await rest.put(Routes.applicationGuildCommands(BOT_ID, guildId), {
            body: [],
        });

        Logger.info(
            `Successfully deleted all application (/) commands for guild: ${guildId}.`
        );
    } catch (err) {
        Logger.error(err, `Error deleting application (/) commands: ${err}`);
    }
})();
