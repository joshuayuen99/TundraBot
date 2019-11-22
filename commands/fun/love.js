const { RichEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { getMember } = require("../../functions.js");

const HEART = "💘";
const BROKENHEART = "💔";
const GROWINGHEART = "💗";

module.exports = {
    name: "love",
    category: "fun",
    description: "Calculates the love affinity you have for another user.",
    usage: "love [mention | id | username]",
    run: async (client, message, args) => {
        let person = getMember(message, args[0]);

        if(!person || message.author.id === person.id) {
            person = message.guild.members
                .filter(m => m.id != message.author.id)
                .random();
        }

        const love = Math.random() * 100;
        const loveIndex = Math.round(love / 10);
        const loveLevel = HEART.repeat(loveIndex) + BROKENHEART.repeat(10 - loveIndex);

        const embedMsg = new RichEmbed()
            .setColor("#ffb6c1")
            .setThumbnail(person.user.displayAvatarURL)
            .addField(stripIndents`**${person.displayName}** loves **${message.member.displayName}** this much:`,
            `${GROWINGHEART}: ${Math.round(love)}%
            
            
            ${loveLevel}`);

        return message.channel.send(embedMsg);
    }
};