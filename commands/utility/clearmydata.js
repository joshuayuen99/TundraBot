const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "clearmydata",
    category: "utility",
    description: "Provides the information needed to clear your data from the bot.",
    usage: "clearmydata",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const embedMsg = new MessageEmbed()
            .setColor("PURPLE")
            .setTimestamp()
            .setFooter(message.member.nickname ? message.member.nickname : message.author.username, message.author.avatarURL)
            .setDescription(`To clear your data (messages), please join [my support server](${process.env.SUPPORT_SERVER_INVITE_LINK}) and ask OR private message \`${process.env.OWNERNAME}${process.env.OWNERTAG}\`. Keep in mind this will impact the \`undelete\` and \`unedit\` commands.`);

        message.channel.send(embedMsg);
    }
}