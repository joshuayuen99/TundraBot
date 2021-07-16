// Load TundraBot class
import { TundraBot } from "./base/TundraBot";
import Logger from "./utils/logger";
import * as dotenv from "dotenv";
import Server from "./dashboard/server";

import fetch from "node-fetch";
import { exit } from "process";

function setup() {
    const result = dotenv.config({
        path: __dirname + "/../.env",
    });
    if (result.error) {
        Logger.log("error", `Error loading .env file:\n${result.error.message}`);
        exit(1);
    }

    // TODO: update package to use fork of discord-player until bugfix gets pushed to production
    const client = new TundraBot();

    // Login
    client.login(process.env.DISCORDTOKEN).catch((err) => {
        Logger.log("error", err);
    });

    // Start dashboard server
    new Server(client);

    // Keep Heroku dyno alive
    setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        fetch(process.env.DASHBOARD_URL).then(() => {
            Logger.log("info", "Reviving");
        }).catch((err) => {
            Logger.log("error", `Error reviving:\n${err}`);
        });
    }, 25 * 60 * 1000); // 25 mins
}

// if there is an unhandledRejection, log them
process.on("unhandledRejection", (err) => {
    Logger.log("error", `unhandledRejection:\n${err}`);
});

setup();