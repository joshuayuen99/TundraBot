const { eventHandleMessageReactionRemove } = require("../commands/utility/event");

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").MessageReaction} reaction Discord MessageReaction
 * @param {import("discord.js").User} user Discord User
*/
module.exports = async (client, reaction, user) => {
    if(client.databaseCache.events.has(reaction.message.id)) eventHandleMessageReactionRemove(client, reaction, user);
}