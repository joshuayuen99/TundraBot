module.exports = {
    name: "ping",
    category: "info",
    description: "Returns latency and API ping.",
    usage: "ping",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const sendMsg = await message.channel.send(`\u{1F3D3} Pinging...`);

        return sendMsg.edit(`\u{1F3D3} Pong!\nLatency is ${Math.round(sendMsg.createdTimestamp - message.createdTimestamp)}.\nAPI Latency is ${Math.round(client.ws.ping)}.`);
    }
};