import { TundraBot } from "./base/TundraBot.ts";
import { Logger } from "./utils/Logger.ts";
import { Env, getEnv } from "./utils/loadEnvironmentVars.ts";

async function main() {
    const tundraBot = new TundraBot();

    try {
        await tundraBot.login(getEnv(Env.DISCORD_TOKEN));
    } catch (err) {
        Logger.error(err, `Error logging in: ${err}`);
    }
}

// if there is an unhandledRejection, log them
process.on("unhandledRejection", (err) => {
    Logger.error(err, `unhandledRejection:\n${err}`);
});

// register on shutdown events
["SIGINT", "SIGTERM", "SIGQUIT"].forEach((signal) =>
    process.on(signal, async () => {
        Logger.info("Shutting down...");
        process.exit(0);
    })
);

main();
