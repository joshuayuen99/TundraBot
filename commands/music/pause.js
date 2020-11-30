module.exports = {
    name: "pause",
    category: "music",
    description: "Pauses the currently playing song.",
    usage: "pause",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const PAUSE_EMOJI = "⏸️";

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

        message.react(PAUSE_EMOJI)
            .catch((err) => { // Probably don't have permissions to react
                message.channel.send("Pausing...");
            }).finally(() => {
                serverQueue.connection.dispatcher.pause();
            });
    }
}