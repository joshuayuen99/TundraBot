// Load TundraBot class
import { TundraBot } from "./base/TundraBot";
import Logger from "./utils/logger";
import * as dotenv from "dotenv";
import Server from "./dashboard/server";

import { exit } from "process";

function setup() {
    try {
        const result = dotenv.config({
            path: __dirname + "/../.env",
        });
        if (result.error) {
            Logger.log("error", `Error loading .env file:\n${result.error.message}`);
            exit(1);
        }
    
        const client = new TundraBot();
    
        // Login
        client.login(process.env.DISCORDTOKEN).catch((err) => {
            Logger.log("error", err);
        });
        
        try {
            // Start dashboard server
            new Server(client);
        } catch (err) {
            Logger.log("error", `Trouble starting dashboard server:\n${err}`);
        }
    } catch (err) {
        Logger.log("error", `Fatal error:\n${err}`);
        exit(1);
    }
    
}

// if there is an unhandledRejection, log them
process.on("unhandledRejection", (err) => {
    Logger.log("error", `unhandledRejection:\n${err}`);
});

setup();