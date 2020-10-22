const { MessageEmbed } = require("discord.js");
const { formatDateLong } = require("../../functions.js")

module.exports = {
    name: "serverinfo",
    aliases: ["server"],
    category: "info",
    description: "Returns information about the server and when the user who requsted it joined.",
    usage: "serverinfo",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const guild = message.guild;
        const sicon = guild.iconURL();

        const embedMsg = new MessageEmbed()
            .setDescription("Server Information")
            .setColor("#0b7ed6")
            .setThumbnail(sicon)
            .addField("Server name", guild.name)
            .addField("Created on", formatDateLong(guild.createdAt))
            .addField("You joined", formatDateLong(message.member.joinedAt))
            .addField("Total members", guild.memberCount);

        return message.channel.send(embedMsg);
    }
};