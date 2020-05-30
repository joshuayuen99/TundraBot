module.exports = {
    name: "repeat",
    category: "music",
    description: "Toggles repeating the current song.",
    usage: "repeat",
    run: async (client, message, args) => {
        const serverQueue = client.musicGuilds.get(message.guild.id);
        if (!serverQueue) {
            return message.reply("There isn't a song currently playing.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }
        serverQueue.repeat = serverQueue.repeat ? false : true;
        return serverQueue.repeat ? message.channel.send("Current song set to repeat.")
            : message.channel.send("Current song no longer repeating");
    }
}