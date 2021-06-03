const { Guild } = require("../models");

module.exports = {
    /**
     * Starts checking...
     * @param {import("discord.js").Client} client Discord Client instance
     */
    async init(client) {
        Guild.find({
            "leaveMessages.enabled": true
        }).then(async (guilds) => {
            async function cacheMembers() {
                for (const guild of guilds) {
                    // Check if guild was deleted
                    if (!client.guilds.cache.has(guild.guildID)) {
                        console.error(`Guild was deleted? (${guild.guildID})`);
                        continue;
                    }

                    client.guilds.cache.get(guild.guildID).members.fetch();
                }
            }
            await cacheMembers();
            console.log(`Cached ${client.users.cache.size} users`);
        }).catch((err) => {
            console.error("cacheMembers init error: ", err);
        });
    }
};