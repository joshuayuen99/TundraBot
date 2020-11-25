const { eventHandleMessageReactionAdd } = require("../commands/utility/event");
const { roleMenuHandleMessageReactionAdd } = require("../commands/utility/rolemenu");

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").MessageReaction} reaction Discord MessageReaction
 * @param {import("discord.js").User} user Discord User
*/
module.exports = async (client, reaction, user) => {
    if (client.databaseCache.events.has(reaction.message.id)) {
        eventHandleMessageReactionAdd(client, reaction, user);
    }

    if (client.databaseCache.roleMenus.has(reaction.message.id)) {
        roleMenuHandleMessageReactionAdd(client, reaction, user);
    }
}