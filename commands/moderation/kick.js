const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { createChannel, promptMessage } = require("../../functions.js");

module.exports = {
	name: "kick",
	category: "moderation",
	decsription: "Kicks the member.",
	usage: "kick <mention | <id> <reason>",
	run: async (client, message, args) => {
		//const CONFIRM = "\u2611"; // Checkmark emoji
		const CONFIRM = "💯";
		//const CONFIRM = "\u1f4af";  // "100" emoji
		const CANCEL = "\u274c";    // red "X" emoji

		if (message.deletable) message.delete();

		// No user specified
		if (!args[0]) {
			return message.reply("Please provide a user to kick.")
				.then(m => m.delete({
					timeout: 5000
				}));
		}

		// No reason specified
		if (!args[1]) {
			return message.reply("Please provide a reason to kick.")
				.then(m => m.delete({
					timeout: 5000
				}));
		}
		const reason = args.splice(1).join(" ");

		// No author permission
		if (!message.member.hasPermission("KICK_MEMBERS")) {
			return message.reply("Nice try guy, you don't have permission to kick people.")
				.then(m => m.delete({
					timeout: 5000
				}));
		}

		// No bot permission
		if (!message.guild.me.hasPermission("KICK_MEMBERS")) {
			return message.reply("I don't have permission to kick people!")
				.then(m => m.delete({
					timeout: 5000
				}));
		}

		const kMember = message.mentions.members.first() || message.guild.members.get(args[0]);

		// No member found
		if (!kMember) {
			return message.reply("Couldn't find that member, try again!")
				.then(m => m.delete({
					timeout: 5000
				}));
		}

		// Can't kick yourself
		if (kMember.id === message.author.id) {
			return message.reply("Don't kick yourself...It'll be alright.")
				.then(m => m.delete({
					timeout: 5000
				}));
		}

		// Can't kick bots
		if (kMember.user.bot) {
			return message.reply("Don't try to kick bots...")
				.then(m => m.delete({
					timeout: 5000
				}));
		}

		// If user isn't kickable (role difference)
		if (!kMember.kickable) {
			return message.reply("They can't be kicked by the likes of you.")
				.then(m => m.delete({
					timeout: 5000
				}));
		}

		const embedMsg = new MessageEmbed()
			.setColor("RED")
			.setThumbnail(kMember.user.displayAvatarURL())
			.setFooter(message.member.displayName, message.author.displayAvatarURL())
			.setTimestamp()
			.setDescription(stripIndents`**\\> Kicked member:** ${kMember} (${kMember.id})
            **\\> Kicked by:** ${message.member}
            **\\> Reason:** ${reason}`);

		const promptEmbed = new MessageEmbed()
			.setColor("GREEN")
			.setAuthor("This verification becomes invalid after 30s")
			.setDescription(`Do you want to kick ${kMember}?`)
		message.channel.send(promptEmbed).then(async msg => {
			const emoji = await promptMessage(msg, message.author, 30, [CONFIRM, CANCEL]);

			if (emoji === CONFIRM) {
				msg.delete();

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

								logChannel.send(embedMsg);
							})
							.catch(err => {
								console.log(err);
							});;
					}
				} else { // Channel already exists
					const logChannel = message.guild.channels.cache.find(channel => channel.name === "admin");

					logChannel.send(embedMsg);
				}

				// Kick after potentially creating the logging channel to avoid it happening twice (once in member leave event as well)
				kMember.kick(reason)
					.catch(err => {
						if (err) return message.channel.send("Well... something went wrong?");
					});
			} else if (emoji === CANCEL) {
				msg.delete();

				message.reply("Kick cancelled...")
					.then(m => m.delete({
						timeout: 5000
					}));
			}
		})
	}
};