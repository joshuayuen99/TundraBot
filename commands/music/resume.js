module.exports = {
    name: "resume",
    aliases: ["unpause"],
    category: "music",
    description: "Resumes the currently paused song.",
    usage: "resumes",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const RESUME_EMOJI = "▶️";

        const serverQueue = client.musicGuilds.get(message.guild.id);
        if (!serverQueue || !serverQueue.connection.dispatcher.paused) {
            return message.reply("There isn't a song currently paused.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        message.react(RESUME_EMOJI)
            .catch((err) => { // Probably don't have permissions to react
                message.channel.send("Resuming...");
            }).finally(() => {
                serverQueue.connection.dispatcher.resume();
            });
    }
}