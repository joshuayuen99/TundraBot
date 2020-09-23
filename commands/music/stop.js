module.exports = {
    name: "stop",
    category: "music",
    description: "Stops playing music.",
    usage: "stop",
    run: async (client, message, args, settings) => {
        const serverQueue = client.musicGuilds.get(message.guild.id);
        if (!serverQueue) {
            return message.reply("There isn't a song currently playing.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        message.channel.send("Stopping...");
        serverQueue.songs = [];
        client.musicGuilds.delete(message.guild.id);
        serverQueue.voiceChannel.leave();
    }
}