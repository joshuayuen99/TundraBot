const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");

module.exports = {
    name: "report",
    category: "moderation",
    description: "Reports a member.",
    usage: "report <mention | id> <reason>",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        // No user specified
        if (!args[0]) {
            return message.reply("Please provide a user to report.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        let rMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        // If there was no reason specified
        if (!args[1])
            return message.reply("Please specify a reason for the report.")
                .then(m => m.delete({
                    timeout: 5000
                }));

        // If the reported member couldn't be found
        if (!rMember)
            return message.reply("Couldn't find that person.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        // If the reported member has permission to ban, or is a bot
        if (rMember.hasPermission("BAN_MEMBERS") || rMember.user.bot)
            return message.reply("They can't be reported by the likes of you.")
                .then(m => m.delete({
                    timeout: 5000
                }));

        const embedMsg = new MessageEmbed()
            .setColor("#ff0000")
            .setTimestamp()
            .setFooter(message.guild.name, message.guild.iconURL)
            .setAuthor("Reported member", rMember.user.displayAvatarURL())
            .setDescription(stripIndents`**\\> Member:** ${rMember} (${rMember.id})
			**\\> Reported by:** ${message.member} (${message.member.id})
			**\\> Reported in:** ${message.channel}
			**\\> Reason:** ${args.slice(1).join(" ")}`);

            if (settings.logMessages.enabled) {
                // Log activity
                if (message.guild.channels.cache.some(channel => channel.id === settings.logMessages.channelID)) {
                    const logChannel = message.guild.channels.cache.find(channel => channel.id === settings.logMessages.channelID);

                    logChannel.send(embedMsg).catch((err) => {
                        // Most likely don't have permissions to type
                        message.channel.send(`I don't have permission to log this in the configured log channel. Please give me permission to write messages there, or use \`${settings.prefix}config logChannel\` to change it.`);
                    });
                    logChannel.send(embedMsg);
                    if (message.deletable) message.delete();
                    message.reply("Your report was submitted.");
                } else { // channel was removed, disable logging in settings
                    client.updateGuild(message.guild, {
                        logMessages: {
                            enabled: false,
                            channelID: null
                        }
                    });
                }
            }
            
        return;
    }
};