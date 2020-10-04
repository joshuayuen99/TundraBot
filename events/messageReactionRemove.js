const { eventHandleMessageReactionRemove } = require("../commands/utility/event");

module.exports = async (client, reaction, user) => {
    if(client.databaseCache.events.has(reaction.message.id)) eventHandleMessageReactionRemove(client, reaction, user);
}