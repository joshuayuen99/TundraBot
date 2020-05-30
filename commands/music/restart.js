module.exports = {
    name: "restart",
    category: "music",
    description: "Restarts the currently playing song.",
    usage: "restart",
    run: async (client, message, args) => {
        const serverQueue = client.musicGuilds.get(message.guild.id);
        if (!serverQueue) {
            return message.reply("There isn't a song currently playing.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

		message.channel.send("Restarting...");
		const oldRepeat = serverQueue.repeat;
		serverQueue.repeat = true;
		await serverQueue.connection.dispatcher.end();
		setTimeout(() => {
			serverQueue.repeat = oldRepeat;
		}, 1000);
    }
}