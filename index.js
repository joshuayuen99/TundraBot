const { Client, Collection } = require("discord.js");
const dotenv = require("dotenv");
const fs = require("fs");

function setup() {
    const result = dotenv.config({
        path: __dirname + "/.env"
    });
    if (result.error) {
        console.error(result.error);
    }

    const client = new Client({
        disableEveryone: false,
        fetchAllMembers: true
    });

    // Config
    client.config = module.exports = {
        owner: process.env.OWNERID,
        prefix: process.env.COMMAND_PREFIX,
        defaultGuildSettings: {
            prefix: process.env.COMMAND_PREFIX,
            welcomeMessage: {
                enabled: false,
                welcomeMessage: "Welcome **{{member}}** to **{{server}}**!",
                channelID: null
            },
            soundboardRole: "Soundboard DJ",
            modRole: "Moderator",
            adminRole: "Administrator",
            logChannel: "tundra-logs"
        }
    }

    client.mongoose = require("./utils/mongoose");
    require("./utils/mongooseFunctions")(client);

    client.commands = new Collection();
    client.aliases = new Collection();

    client.categories = fs.readdirSync("./commands/");

    ["commands", "events"].forEach(handler => {
        require(`./handlers/${handler}`)(client);
    });

    module.exports.client = client;
    module.exports.commands = client.commands;

    // Map with guilds playing music ?
    client.musicGuilds = new Map();

    // Map with guilds playing soundboard effects
    client.soundboardGuilds = new Map();

    // Map with members playing games
    client.gameMembers = new Map();

    // Set of people currently stealing emojis in a server
    // `${guildID}${userID}
    client.activeEmojiStealing = new Set();

    // Set of people we are currently waiting on a response from so that we can ignore any further commands until we get it
    client.waitingResponse = new Set();

    // Map with invites for each guild
    client.guildInvites = new Map();

    client.mongoose.init();

    client.databaseCache = {};
    client.databaseCache.settings = new Collection();
    client.databaseCache.events = new Collection();
    client.databaseCache.roleMenus = new Collection();
    client.databaseCache.soundEffects = new Collection();
    client.databaseCache.memberSoundEffects = new Collection();

    client.login(process.env.DISCORDTOKEN);

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