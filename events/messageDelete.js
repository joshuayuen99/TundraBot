/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").Message} message Discord Message
*/
module.exports = async (client, message) => {
    if (message.author.bot) return; // if a bot's message was deleted

    // If the message was not sent in a server
    if (!message.guild) return;

    // Update message in database
    client.updateMessage(message, null, { deleted: true });
}