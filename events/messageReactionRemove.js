const { eventHandleMessageReactionRemove } = require("../commands/utility/event");
const { roleMenuHandleMessageReactionRemove } = require("../commands/utility/rolemenu");

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").MessageReaction} reaction Discord MessageReaction
 * @param {import("discord.js").User} user Discord User
*/
module.exports = async (client, reaction, user) => {
    if (client.databaseCache.events.has(reaction.message.id)) eventHandleMessageReactionRemove(client, reaction, user);

    if (client.databaseCache.roleMenus.has(reaction.message.id)) {
        roleMenuHandleMessageReactionRemove(client, reaction, user);
    }
}