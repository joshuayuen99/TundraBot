module.exports = {
    name: "ping",
    category: "info",
    description: "Returns latency and API ping.",
    usage: "ping",
    run: async (client, message, args) => {
        const sendMsg = await message.channel.send(`\u{1F3D3} Pinging...`);

        return sendMsg.edit(`\u{1F3D3} Pong!\nLatency is ${Math.round(sendMsg.createdTimestamp - message.createdTimestamp)}.\nAPI Latency is ${Math.round(client.ws.ping)}.`);
    }
};