const { Guild } = require("../models");

module.exports = {
    /**
     * Starts checking...
     * @param {import("discord.js").Client} client Discord Client instance
     */
    async init(client) {
        Guild.find({
            "joinMessages.enabled": true
        }).then(async (guilds) => {
            for (const guild of guilds) {
                // Fetch guild if not cached already
                if (!client.guilds.cache.has(guild.guildID)) await client.guilds.fetch(guild.guildID).catch((err) => {
                    console.error("Guild was deleted?: ", err);
                });

                const discordGuild = client.guilds.cache.get(guild.guildID);
                await module.exports.cacheInvites(client, discordGuild);
            }
            console.log(`Cached ${client.guildInvites.size} invites`);
        }).catch((err) => {
            console.error("cacheInvites init error: ", err);
        });
    },

    /**
     * @param {import("discord.js").Guild} guild Discord Guild
     */
    async cacheInvites(client, guild) {
        await guild.fetchInvites().then(invites => {
            for (const invite of invites) {
                let currentInvites = client.guildInvites.get(guild.id);
                if (!currentInvites) currentInvites = new Map();
                currentInvites.set(invite[0], invite[1]);
                client.guildInvites.set(guild.id, currentInvites);
            }
        }).catch((err) => {
            console.error("fetchInvites error: ", err);
        });
    }
};

