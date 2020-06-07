const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { createChannel } = require("../../functions.js");

module.exports = {
	name: "report",
	category: "moderation",
	description: "Reports a member.",
	usage: "report <mention | id> <reason>",
	run: async (client, message, args) => {
		if (message.deletable) message.delete();

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

		// Log activity and create channel if necessary
		if (!message.guild.channels.cache.some(channel => channel.name === "admin")) {
			if (!message.guild.me.hasPermission("MANAGE_CHANNELS")) {
				message.channel.send("I couldn't send the log to the correct channel and I don't have permissions to create it.");
			} else {
				await createChannel(message.guild, "admin", [{
					id: message.guild.id,
					deny: ["VIEW_CHANNEL"],
				}])
					.then(() => {
						const logChannel = message.guild.channels.cache.find(channel => channel.name === "admin");

						const embedMsg = new MessageEmbed()
							.setColor("#ff0000")
							.setTimestamp()
							.setFooter(message.guild.name, message.guild.iconURL)
							.setAuthor("Reported member", rMember.user.displayAvatarURL())
							.setDescription(stripIndents`**\\> Member:** ${rMember} (${rMember.id})
					**\\> Reported by:** ${message.member} (${message.member.id})
					**\\> Reported in:** ${message.channel}
					**\\> Reason:** ${args.slice(1).join(" ")}`);

						logChannel.send(embedMsg);
						return message.reply("Your report was submitted.");
					})
					.catch(err => {
						console.log(err);
					});;
			}
		} else { // Channel already exists
			const logChannel = message.guild.channels.cache.find(channel => channel.name === "admin");

			return logChannel.send(embedMsg);
		}
	}
};