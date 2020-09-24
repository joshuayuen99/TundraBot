const { Client, Collection } = require("discord.js");
const { config } = require("dotenv");
const fs = require("fs");

function setup() {
    const client = new Client({
        disableEveryone: false
    });

    config({
        path: __dirname + "/.env"
    });

    client.mongoose = require("./utils/mongoose");
    client.config = require("./config");
    require("./utils/mongooseFunctions")(client);

    client.commands = new Collection();
    client.aliases = new Collection();

    client.categories = fs.readdirSync("./commands/");

    ["commands", "events"].forEach(handler => {
        require(`./handlers/${handler}`)(client);
    });

    // Map with guilds playing music ?
    client.musicGuilds = new Map();

    // Set of people we are currently waiting on a response from so that we can ignore any further commands until we get it
    client.waitingResponse = new Set();

    client.mongoose.init();

    client.login(process.env.DISCORDTOKEN);
}

// if there is an unhandledRejection, log them
process.on("unhandledRejection", (err) => {
	console.error("unhandledRejection:\n", err);
});

setup();