module.exports = {
    name: "resume",
    aliases: ["unpause"],
    category: "music",
    description: "Resumes the currently paused song.",
    usage: "resumes",
    run: async (client, message, args) => {
        const serverQueue = client.musicGuilds.get(message.guild.id);
        if (!serverQueue || !serverQueue.connection.dispatcher.paused) {
            return message.reply("There isn't a song currently paused.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        serverQueue.connection.dispatcher.resume();
        return message.channel.send("Resuming...");
    }
}