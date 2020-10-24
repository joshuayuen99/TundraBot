const { RoleMenu } = require("../models");

module.exports = {
    /**
     * Starts checking...
     * @param {import("discord.js").Client} client Discord Client instance
     */
	async init(client){
        RoleMenu.find().then(async (roleMenus) => {
            for (roleMenu of roleMenus) {
                // Fetch role menu message if not cached already
                if(!client.guilds.cache.has(roleMenu.guildID)) await client.guilds.fetch(roleMenu.guildID);
                if(!client.channels.cache.has(roleMenu.channelID)) await client.channels.fetch(roleMenu.channelID);
                const channel = client.channels.cache.get(roleMenu.channelID);
                if(!channel.messages.cache.has(roleMenu.messageID)) await channel.messages.fetch(roleMenu.messageID);

                client.databaseCache.roleMenus.set(roleMenu.messageID, roleMenu);
            }
        })
    }
};