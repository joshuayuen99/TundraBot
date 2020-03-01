const { RichEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");

module.exports = {
    name: "queue",
    aliases: ["q", "upnext"],
    category: "music",
    description: "Displays the current queue.",
    usage: "queue",
    run: async (client, message, args) => {
        const serverQueue = client.musicGuilds.get(message.guild.id);
        if(!serverQueue) return message.channel.send("There isn't a queue currently");
        
        const embedMsg = new RichEmbed()
        .setColor("BLUE")

        let queue = "";

        for(i = 0; i < serverQueue.songs.length && i < 5; i++) {
            queue = queue.concat(`**${i + 1}:** ${serverQueue.songs[i].title}\n\n`);
        }
        embedMsg.addField("Current queue:", stripIndents`${queue}`);

        message.channel.send(embedMsg);
    }
}