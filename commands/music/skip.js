module.exports = {
    name: "skip",
    aliases: ["next"],
    category: "music",
    description: "Skips the currently playing song.",
    usage: "skip",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const serverQueue = client.musicGuilds.get(message.guild.id);
        if (!serverQueue) {
            return message.reply("There isn't a song currently playing.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        message.channel.send("Skipping...");
        serverQueue.connection.dispatcher.end();
    }
}