const { RichEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");

const DICE = "🎲";

module.exports = {
    name: "rng",
    aliases: ["random"],
    category: "utility",
    description: "Provides a random number from <min> to <max> or from 0-100 by default.",
    usage: "rng [<min max>]",
    run: async (client, message, args) => {
        let min, max;
        if(args[0] && args[1]) {
            min = parseInt(args[0]);
            max = parseInt(args[1]);
        } else {
            min = 0;
            max = 100;
        }

        const result = Math.round(Math.random() * (max - min) + min);

        const embedMsg = new RichEmbed()
            .setColor(client.user.displayHexColor)
            .setFooter(message.guild.me.displayName, client.user.displayAvatarURL)
            .setTimestamp()
            .setDescription(`Generated a random number from ${min}-${max}`)
            .addField("Result", result);

        if(!(min < max)) {
            return message.reply("min must be smaller than max!");
        }

        return message.channel.send(embedMsg);
    }
};