// Load TundraBot class
import { TundraBot } from "./base/TundraBot";

function setup() {
    const client = new TundraBot();

    // Login
    client.login(process.env.DISCORDTOKEN).catch((err) => {
        console.error(err);
    });

    // Start dashboard server
    require("./dashboard/server");

    // Keep Heroku dyno alive
    setInterval(() => {
        require("node-fetch")(process.env.DASHBOARD_URL);
        console.log("Reviving");
    }, 25 * 60 * 1000);
}

// if there is an unhandledRejection, log them
process.on("unhandledRejection", (err) => {
    console.error("unhandledRejection:\n", err);
});

setup();