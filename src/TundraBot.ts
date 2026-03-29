import { TundraBot } from "./base/TundraBot.ts";
import { Logger } from "./utils/Logger.ts";
import { DISCORD_TOKEN } from "./utils/loadEnvironmentVars.ts";

async function main() {
    const tundraBot = new TundraBot();

    try {
        await tundraBot.login(DISCORD_TOKEN);
    } catch (err) {
        Logger.error(`Error logging in: ${err}`);
    }
}

// if there is an unhandledRejection, log them
process.on("unhandledRejection", (err) => {
    Logger.error(`unhandledRejection:\n${err}`);
});

// register on shutdown events
["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) =>
    process.on(signal, async () => {
        Logger.info("Shutting down...");
        process.exit(0);
    })
);

main();
