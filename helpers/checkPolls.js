const { Poll } = require("../models");
const { pollHandleFinish } = require("../commands/utility/poll");

module.exports = {
    /**
     * Starts checking...
     * @param {import("discord.js").Client} client Discord Client instance
     */
    async init(client) {
        Poll.find().then(async (polls) => {
            const dateNow = Date.now();
            for (const poll of polls) {
                try {
                    // Fetch poll message if not cached already
                    if (!client.guilds.cache.has(poll.guildID)) await client.guilds.fetch(poll.guildID).catch((err) => {
                        console.error(`Guild was deleted? (${poll.guildID}) Removing poll from database: `, err);
                        throw err;
                    });
                    if (!client.channels.cache.has(poll.channelID)) await client.channels.fetch(poll.channelID).catch((err) => {
                        console.error(`Channel was deleted? (${poll.channelID}) Removing poll from database: `, err);
                        throw err;
                    });
                    const channel = client.channels.cache.get(poll.channelID);
                    if (!channel) continue;
                    if (!channel.messages.cache.has(poll.messageID)) await channel.messages.fetch(poll.messageID).then((message) => {
                        // Poll is still ongoing
                        if (poll.endTime > dateNow) {
                            setTimeout(() => {
                                pollHandleFinish(client, poll);
                                Poll.deleteOne(poll).catch((err) => {
                                    console.error("Couldn't delete poll from database: ", err);
                                });
                            }, poll.endTime - dateNow);
                        } else { // Poll is finished
                            pollHandleFinish(client, poll);
                            Poll.deleteOne(poll).catch((err) => {
                                console.error("Couldn't delete poll from database: ", err);
                            });
                        }
                    }).catch((err) => {
                        console.error("Poll was deleted manually? Removing poll from database: ", err);
                        throw err;
                    });
                } catch (err) {
                    // remove poll from database
                    Poll.deleteOne({ messageID: poll.messageID }).catch((err) => {
                        console.error("Couldn't delete event from database: ", err);
                    });
                }
            }
            console.log(`Loaded ${polls.length} polls`);
        })
    }
};