const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "playing",
    aliases: ["nowplaying", "np"],
    category: "music",
    description: "Displays the currently playing song.",
    usage: "playing",
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

        const embedMsg = new MessageEmbed()
            .setColor("BLUE")
            .setDescription(`🎵 Currently playing: [${serverQueue.songs[0].title}](${serverQueue.songs[0].url})\nThere ${serverQueue.songs.length == 1 ? "is currently `1` song" : `are currently \`${serverQueue.songs.length}\` songs`} in queue.`);

        message.channel.send(embedMsg);
    }
}