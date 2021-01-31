const { Event } = require("../models");
const { eventHandleFinish } = require("../commands/utility/event");

module.exports = {
    /**
     * Starts checking...
     * @param {import("discord.js").Client} client Discord Client instance
     */
    async init(client) {
        Event.find().then(async (events) => {
            const dateNow = Date.now();
            for (const event of events) {
                try {
                    // Fetch event message if not cached already
                    if (!client.guilds.cache.has(event.guildID)) await client.guilds.fetch(event.guildID).catch((err) => {
                        console.error(`Guild was deleted? (${event.guildID}) Removing event from database: `, err);
                        throw err;
                    });
                    if (!client.channels.cache.has(event.channelID)) await client.channels.fetch(event.channelID).catch((err) => {
                        console.error(`Channel was deleted? (${event.channelID}) Removing event from database: `, err);
                        throw err;
                    });
                    const channel = client.channels.cache.get(event.channelID);
                    if (!channel) continue;
                    if (!channel.messages.cache.has(event.messageID)) await channel.messages.fetch(event.messageID).then((message) => {
                        client.databaseCache.events.set(event.messageID, event);

                        // Event is still ongoing
                        if (event.endTime > dateNow) {
                            setTimeout(() => {
                                eventHandleFinish(client, event);
                            }, event.endTime - dateNow);
                        } else { // Poll is finished
                            eventHandleFinish(client, event);
                        }
                    }).catch((err) => {
                        console.error("Event was deleted manually? Removing event from database: ", err);
                        throw err;
                    });
                } catch (err) {
                    // remove event from database
                    Event.deleteOne({ messageID: event.messageID }).catch((err) => {
                        console.error("Couldn't delete event from database: ", err);
                    });
                }

            }
            console.log(`Loaded ${events.length} events`);
        });
    }
};