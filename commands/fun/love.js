const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { getMember } = require("../../functions.js");

const HEART = "💘";
const BROKENHEART = "💔";
const GROWINGHEART = "💗";

module.exports = {
    name: "love",
    category: "fun",
    description: "Calculates the love affinity you have with another user.",
    usage: "love [mention | id | username]",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        let person = getMember(message, args[0]);

        if (!person || message.author.id === person.id) {
            person = message.guild.members.cache
                .filter(m => m.id != message.author.id)
                .random();
        }

        const love = Math.random() * 100;
        const loveIndex = Math.round(love / 10);
        const loveLevel = HEART.repeat(loveIndex) + BROKENHEART.repeat(10 - loveIndex);

        const embedMsg = new MessageEmbed()
            .setColor("#ffb6c1")
            .setThumbnail(person.user.displayAvatarURL())
            .addField(stripIndents`**${person.displayName}** loves **${message.member.displayName}** this much:`,
                `${GROWINGHEART}: ${Math.round(love)}%
            
            
            ${loveLevel}`);

        return message.channel.send(embedMsg);
    }
};