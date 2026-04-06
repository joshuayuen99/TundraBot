import { REST, Routes } from "discord.js";
import { slashCommands } from "../src/loaders/commands.ts";
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
            `Started refreshing ${slashCommands.length} application (/) commands.`
        );

        const slashCommandBuilders = slashCommands.map(
            (slashCommand) => slashCommand.slashCommand
        );

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = (await rest.put(
            Routes.applicationGuildCommands(BOT_ID, guildId),
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
