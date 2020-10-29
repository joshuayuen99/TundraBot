const { MessageEmbed } = require("discord.js");
const { formatDateLong } = require("../../functions.js");

module.exports = {
    name: "botinfo",
    aliases: ["info", "about"],
    category: "info",
    description: "Returns information about the bot.",
    usage: "botinfo",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const bicon = client.user.displayAvatarURL();

        const embedMsg = new MessageEmbed()
            .setDescription("Bot Information")
            .setColor("#0b7ed6")
            .setThumbnail(bicon)
            .addField("Bot name", client.user.username)
            .addField("My owner", `${process.env.OWNERNAME}${process.env.OWNERTAG}`)
            .addField("Dashboard", `[Check out my dashboard!](${process.env.DASHBOARD_URL})`)
            .addField("Invite link", `[Invite me to your server!](${process.env.BOT_INVITE_LINK})`)
            .addField("Official Discord server", `[Join my official Discord server!](${process.env.SUPPORT_SERVER_INVITE_LINK})`)
            .addField("Source code", "https://github.com/joshuayuen99/discordbot")
			.addField("Server count", client.guilds.cache.size)
            .addField("Created at", formatDateLong(client.user.createdAt));

        return message.channel.send(embedMsg);
    }
};