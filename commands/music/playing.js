module.exports = {
    name: "playing",
    aliases: ["nowplaying", "np"],
    category: "music",
    description: "Displays the currently playing song.",
    usage: "playing",
    run: async (client, message, args) => {
        const serverQueue = client.musicGuilds.get(message.guild.id);
        if (!serverQueue) {
            return message.reply("There isn't a song currently playing.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        message.channel.send(`Currently playing:\n${serverQueue.songs[0].url}`)
    }
}