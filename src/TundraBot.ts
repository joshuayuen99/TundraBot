import { Logger } from "./utils/Logger.ts";

Logger.info("Hello, World!");

// if there is an unhandledRejection, log them
process.on("unhandledRejection", (err) => {
    Logger.error(`unhandledRejection:\n${err}`);
});

// register on shutdown events
["SIGINT", "SIGTERM", "SIGQUIT"].forEach(signal =>
    process.on(signal, async () => {
        process.exit(0);
    }),
);
