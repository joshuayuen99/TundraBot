const { RoleMenu } = require("../models");

module.exports = {
    /**
     * Starts checking...
     * @param {import("discord.js").Client} client Discord Client instance
     */
    async init(client) {
        RoleMenu.find().then(async (roleMenus) => {
            for (const roleMenu of roleMenus) {
                try {
                    // Fetch role menu message if not cached already
                    if (!client.guilds.cache.has(roleMenu.guildID)) {
                        console.error(`Guild was deleted? (${roleMenu.guildID}) Removing role menu from database`);
                        throw new Error();
                    }
                    if (!client.channels.cache.has(roleMenu.channelID)) await client.channels.fetch(roleMenu.channelID).catch((err) => {
                        console.error(`Channel was deleted? (${roleMenu.channelID}) Removing role menu from database: `, err);
                        throw err;
                    });
                    const channel = client.channels.cache.get(roleMenu.channelID);
                    if (!channel) continue;
                    if (!channel.messages.cache.has(roleMenu.messageID)) await channel.messages.fetch(roleMenu.messageID).then((message) => {
                        client.databaseCache.roleMenus.set(roleMenu.messageID, roleMenu);
                    }).catch((err) => {
                        console.error("Role menu was deleted manually? Removing role menu from database: ", err);
                        throw err;

                    });
                } catch (err) {
                    // remove role menu from database
                    RoleMenu.deleteOne({ messageID: roleMenu.messageID }).catch((err) => {
                        console.error("Couldn't delete role menu from database: ", err);
                    });
                }
            }
            console.log(`Loaded ${roleMenus.length} rolemenus`);
        })
    }
};