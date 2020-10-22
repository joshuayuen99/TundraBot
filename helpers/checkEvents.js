const { Client } = require("discord.js");
const { Event } = require("../models");
const { eventHandleFinish } = require("../commands/utility/event");

module.exports = {
    
	/**
     * Starts checking...
     * @param {Client} client Discord Client instance
     */
	async init(client){
        Event.find().then(async (events) => {
            const dateNow = Date.now();
            for(const event of events) {
                // Fetch poll message if not cached already
                if(!client.guilds.cache.has(event.guildID)) await client.guilds.fetch(event.guildID);
                if(!client.channels.cache.has(event.channelID)) await client.channels.fetch(event.channelID);
                const channel = client.channels.cache.get(event.channelID);
                if(!channel.messages.cache.has(event.messageID)) await channel.messages.fetch(event.messageID);

                client.databaseCache.events.set(event.messageID, event);

                // Event is still ongoing
                if(event.endTime > dateNow) {
                    setTimeout(() => {
                        eventHandleFinish(client, event);
                    }, event.endTime - dateNow);
                } else { // Poll is finished
                    eventHandleFinish(client, event);
                }
            }
        })
    }
};