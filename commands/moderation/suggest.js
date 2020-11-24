const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");

module.exports = {
    name: "suggest",
    aliases: ["suggestion", "suggestions"],
    category: "moderation",
    description: "Suggests a feature to implement.",
    usage: "suggest <suggestion>",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        // If there was no suggestion specified
        if (!args[0]) {
            await message.reply("Please specify a suggestion!")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        const owner = await client.users.fetch(process.env.OWNERID);

        const embedMsg = new MessageEmbed()
            .setColor("#390645")
            .setTimestamp()
            .setFooter(message.guild.name, message.guild.iconURL())
            .setAuthor("Suggestion by", message.author.displayAvatarURL())
            .setDescription(stripIndents`**\\> Member:** ${message.member} (${message.member.id})
            **\\> Suggested in:** ${message.guild}'s ${message.channel} (${message.guild.id})
            **\\> Suggestion:** ${args.join(" ")}`);

        message.reply(`Thanks! Your suggestion has been sent to my creator ${process.env.OWNERNAME}${process.env.OWNERTAG}.`);
        return owner.send(embedMsg);
    }
};