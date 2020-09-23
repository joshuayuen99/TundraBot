const { MessageEmbed } = require("discord.js");
const { formatDateLong } = require("../../functions.js");

module.exports = {
    name: "botinfo",
    aliases: ["info", "about"],
    category: "info",
    description: "Returns information about the bot.",
    usage: "botinfo",
    run: async (client, message, args, settings) => {
        const bicon = client.user.displayAvatarURL();

        const embedMsg = new MessageEmbed()
            .setDescription("Bot Information")
            .setColor("#0b7ed6")
            .setThumbnail(bicon)
            .addField("Bot name", client.user.username)
            .addField("My owner", `${process.env.OWNERNAME}${process.env.OWNERTAG}`)
            .addField("Invite link", "[Invite me to your server!](https://discord.com/api/oauth2/authorize?client_id=647196546492006423&permissions=309587062&scope=bot)")
            .addField("Source code", "https://github.com/joshuayuen99/discordbot")
			.addField("Server count", client.guilds.cache.size)
            .addField("Created at", formatDateLong(client.user.createdAt));

        return message.channel.send(embedMsg);
    }
};