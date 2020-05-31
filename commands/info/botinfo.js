const { MessageEmbed } = require("discord.js");
const { formatDateLong } = require("../../functions.js")

module.exports = {
    name: "botinfo",
    aliases: ["info", "about"],
    category: "info",
    description: "Returns information about the bot.",
    usage: "botinfo",
    run: async (client, message, args) => {
        const bicon = client.user.displayAvatarURL();

        const embedMsg = new MessageEmbed()
            .setDescription("Bot Information")
            .setColor("#0b7ed6")
            .setThumbnail(bicon)
            .addField("Bot name", client.user.username)
			.addField("My owner", "TundraBuddy#4650")
			.addField("GitHub link", "https://github.com/joshuayuen99/discordbot")
			.addField("Server count", client.guilds.cache.size)
            .addField("Created at", formatDateLong(client.user.createdAt));

        return message.channel.send(embedMsg);
    }
};