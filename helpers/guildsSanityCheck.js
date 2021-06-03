const { Guild } = require("../models");
const guildCreate = require("../events/guildCreate");

module.exports = {
    /**
     * Starts checking...
     * @param {import("discord.js").Client} client Discord Client instance
     */
    async init(client) {
        Guild.find().then(async (guilds) => {
            // Check for newly left guilds
            for (const guild of guilds) {
                // Check if guild was deleted
                if (!client.guilds.cache.has(guild.guildID)) {
                    console.error(`Guild was deleted? (${guild.guildID})`);
                    continue;
                }
            }

            // Check for newly joined guilds
            for (const cachedGuild of client.guilds.cache) {
                // New guild without defaults set yet
                if (!guilds.some(guild => guild.guildID === cachedGuild[1].id)) {
                    // Create defaults
                    guildCreate(client, cachedGuild[1]);
                }
            }
        });
    }
}