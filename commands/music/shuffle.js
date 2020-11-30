const { MessageEmbed } = require("discord.js");
const { shuffle } = require("../../functions.js");

module.exports = {
    name: "shuffle",
    category: "music",
    description: "Shuffles the current queue, or toggles shuffling of the queue with the [toggle] or [t] option. This will cause the queue to be shuffled whenever a new song is added to it.",
    usage: "shuffle [toggle | t]",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const SHUFFLE_EMOJI = "🔀";

        const serverQueue = client.musicGuilds.get(message.guild.id);
        if (!serverQueue) {
            return message.reply("There isn't a queue to shuffle.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        // If not toggled, just shuffle
        if (!args[0]) {
            const currentSong = serverQueue.songs.slice(0, 1);
            serverQueue.songs = currentSong.concat(shuffle(serverQueue.songs.slice(1)));

            const embedMsg = new MessageEmbed()
                .setColor("BLUE")
                .setDescription(`${SHUFFLE_EMOJI} Current queue has been shuffled.`);

            message.channel.send(embedMsg);
            return;
        }
        else if (args[0].toLowerCase() == "toggle" || args[0].toLowerCase() == "t") {
            serverQueue.toggle = serverQueue.toggle ? false : true;

            const embedMsg = new MessageEmbed()
                .setColor("BLUE")
                .setDescription(`${SHUFFLE_EMOJI} Shuffling is now set to ${serverQueue.toggle}.`);

            message.channel.send(embedMsg);
            return;
        }
        else {
            const currentSong = serverQueue.songs.slice(0, 1);
            serverQueue.songs = currentSong.concat(shuffle(serverQueue.songs.slice(1)));

            const embedMsg = new MessageEmbed()
                .setColor("BLUE")
                .setDescription(`${SHUFFLE_EMOJI} Current queue has been shuffled.`);

            message.channel.send(embedMsg);
            return;
        }
    }
}