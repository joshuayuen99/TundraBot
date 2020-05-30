module.exports = {
    name: "pause",
    category: "music",
    description: "Pauses the currently playing song.",
    usage: "pause",
    run: async (client, message, args) => {
        const serverQueue = client.musicGuilds.get(message.guild.id);
        if (!serverQueue) {
            return message.reply("There isn't a song currently playing.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        if (serverQueue.connection.dispatcher.paused) {
            return message.reply("There is already a song paused!")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        serverQueue.connection.dispatcher.pause();
        return message.channel.send("Pausing...");
    }
}