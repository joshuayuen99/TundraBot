const { Poll } = require("../models");
const { pollHandleFinish } = require("../commands/utility/poll");

module.exports = {
    
	/**
     * Starts checking...
     * @param {object} client The Discord Client instance
     */
	async init(client){
        Poll.find().then(async (polls) => {
            const dateNow = Date.now();
            for(const poll of polls) {
                // Fetch poll message if not cached already
                if(!client.guilds.cache.has(poll.guildID)) await client.guilds.fetch(poll.guildID);
                if(!client.channels.cache.has(poll.channelID)) await client.channels.fetch(poll.channelID);
                const channel = client.channels.cache.get(poll.channelID);
                if(!channel.messages.cache.has(poll.messageID)) await channel.messages.fetch(poll.messageID);

                // Poll is still ongoing
                if(poll.endTime > dateNow) {
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
            }
        })
    }
};