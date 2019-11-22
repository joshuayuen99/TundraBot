const { RichEmbed } = require("discord.js");

module.exports = {
    name: "serverinfo",
    category: "info",
    description: "Returns information about the server and when the user who requsted it joined",
    run: async (client, message, args) => {
        const guild = message.guild;
        const sicon = guild.iconURL;

        const embedMsg = new RichEmbed()
            .setDescription("Server information")
            .setColor("#0b7ed6")
            .setThumbnail(sicon)
            .addField("Server name", guild.name)
            .addField("Created on", guild.createdAt)
            .addField("You joined", message.member.joinedAt)
            .addField("Total members", guild.memberCount);

        return message.channel.send(embedMsg);
    }
};