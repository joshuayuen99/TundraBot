const { MessageEmbed } = require("discord.js");

module.exports = {
    name: "coin",
    aliases: ["flip"],
    category: "utility",
    description: "Flips a coin!",
    usage: "coin",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const result = Math.round(Math.random());

        let resultString;
        if (result == 0) resultString = "Heads!";
        else resultString = "Tails!";

        const embedMsg = new MessageEmbed()
            .setColor(client.user.displayHexColor)
            .setFooter(message.guild.me.displayName, client.user.displayAvatarURL())
            .setTimestamp()
            .setDescription(`${message.author} Flipped a coin!`)
            .addField(`Result`, resultString);

        return message.channel.send(embedMsg);
    }
};