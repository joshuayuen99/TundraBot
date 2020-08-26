const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");

module.exports = {
    name: "emoji",
    aliases: ["unicode", "uni"],
    category: "utility",
    description: "Gives the unicode for the entered emoji(s).",
    usage: "emoji <emoji> [...emoji]",
    run: async (client, message, args) => {
        if (!args[0]) return message.reply("Please enter an emoji");

        let emojisList;
        for (const word of args) {
            if (!emojisList) {
                emojisList = `\`\\u${toUni(word)}\``;
                continue;
            }
            emojisList += `, \`\\u${toUni(word)}\``;
        }

        message.channel.send(stripIndents`${args.join(" ")} Emoji/Character info:
        ${emojisList}`);
    }
};

const toUni = function (str) {
    if (str.length < 4)
        return str.codePointAt(0).toString(16);
    return str.codePointAt(0).toString(16) + '-' + str.codePointAt(2).toString(16);
};