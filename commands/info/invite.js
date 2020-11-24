const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "invite",
    aliases: ["link"],
    category: "info",
    description: "Gives you an invite link for the bot.",
    usage: "invite",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const bicon = client.user.displayAvatarURL();

        const embedMsg = new MessageEmbed()
        .addField("Invite link", `[Invite me to your server!](${process.env.BOT_INVITE_LINK})`)
        .addField("Official Discord server", `[Join my official Discord server!](${process.env.SUPPORT_SERVER_INVITE_LINK})`)
            .setColor("#0b7ed6")
            .setThumbnail(bicon);

        return message.channel.send(embedMsg);
    }
};