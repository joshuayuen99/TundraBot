module.exports = {
    name: "restart",
    category: "music",
    description: "Restarts the currently playing song.",
    usage: "restart",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const RESTART_EMOJI = "◀️";

        const serverQueue = client.musicGuilds.get(message.guild.id);
        if (!serverQueue) {
            return message.reply("There isn't a song currently playing.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        message.react(RESTART_EMOJI)
            .catch((err) => { // Probably don't have permissions to react
                message.channel.send("Restarting...");
            }).finally(() => {
                const oldRepeat = serverQueue.repeat;
                serverQueue.repeat = true;
                serverQueue.connection.dispatcher.end();
                setTimeout(() => {
                    serverQueue.repeat = oldRepeat;
                }, 1000);
            });
    }
}