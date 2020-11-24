const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");

module.exports = {
    name: "queue",
    aliases: ["q", "upnext"],
    category: "music",
    description: "Displays the current queue.",
    usage: "queue",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const serverQueue = client.musicGuilds.get(message.guild.id);
        if (!serverQueue) return message.channel.send("There isn't a queue currently.");

        const embedMsg = new MessageEmbed()
            .setColor("BLUE")

        let queue = "";

        for (let i = 0; i < serverQueue.songs.length && i < 5; i++) {
            queue = queue.concat(`**${i + 1}:** [${serverQueue.songs[i].title}](${serverQueue.songs[i].url})\n\n`);
        }
        if (serverQueue.songs.length > 1) embedMsg.addField(`Current queue (${serverQueue.songs.length} songs):`, stripIndents`${queue}`);
        else embedMsg.addField(`Current queue (${serverQueue.songs.length} song):`, stripIndents`${queue}`);

        message.channel.send(embedMsg);
    }
}