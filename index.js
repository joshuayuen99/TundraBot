const { Client, MessageEmbed, Collection } = require("discord.js");
const { config } = require("dotenv");
const fs = require("fs");
const { stripIndents } = require("common-tags");
const { createChannel, formatDate, formatDateLong } = require("./functions.js");

function setup() {
	const client = new Client({
		disableEveryone: false
	});

	config({
		path: __dirname + "/.env"
	});

	//const prefix = "~";

	client.commands = new Collection();
	client.aliases = new Collection();

	client.categories = fs.readdirSync("./commands/");

	["command"].forEach(handler => {
		require(`./handler/${handler}`)(client);
	});

	client.on("ready", () => {
		client.user.setPresence({
			status: "online",
			activity: {
				name: "music ~play | ~help",
				type: "PLAYING",
			}
		});

		console.log(`I'm now online, my name is ${client.user.username}`);
	});

	// Map with guilds playing music ?
	client.musicGuilds = new Map();

	// Set of people we are currently waiting on a response from so that we can ignore any further commands until we get it
	client.waitingResponse = new Set();

	// When someone leaves the guild
	client.on("guildMemberRemove", async member => {
		const guild = member.guild;
		const micon = member.user.displayAvatarURL();

		const embedMsg = new MessageEmbed()
			.setDescription(`${member.user.username} left the server`)
			.setColor("RED")
			.setThumbnail(micon)
			.addField(`${member.user.username} joined`, `${formatDateLong(member.joinedAt)} EST`)
			.addField("New total members", guild.memberCount)
			.setTimestamp();

		// Log activity and create channel if necessary
		if (!member.guild.channels.cache.some(channel => channel.name === "admin")) {
			if (!member.guild.me.hasPermission("MANAGE_CHANNELS")) {
				// TODO: send message in #general?
				//message.channel.send("I couldn't send the log to the correct channel and I don't have permissions to create it.");
			} else {
				await createChannel(member.guild, "admin", [{
					id: member.guild.id,
					deny: ["VIEW_CHANNEL"],
				}])
					.then(() => {
						const logChannel = member.guild.channels.cache.find(channel => channel.name === "admin");

						return logChannel.send(embedMsg);
					})
					.catch(err => {
						console.log(err);
					});;
			}
		} else { // Channel already exists
			const logChannel = member.guild.channels.cache.find(channel => channel.name === "admin");

			return logChannel.send(embedMsg);
		}
	});

	// When someone joins the guild
	client.on("guildMemberAdd", async member => {
		const guild = member.guild;
		const micon = member.user.displayAvatarURL();

		const embedMsg = new MessageEmbed()
			.setDescription(`${member.user.username} joined the server`)
			.setColor("GREEN")
			.setThumbnail(micon)
			.addField(`${member.user.username} joined`, `${formatDateLong(member.joinedAt)} EST`)
			.addField("New total members", guild.memberCount)
			.setTimestamp();

		// Log activity and create channel if necessary
		if (!member.guild.channels.cache.some(channel => channel.name === "admin")) {
			if (!member.guild.me.hasPermission("MANAGE_CHANNELS")) {
				// TODO: send message in #general?
				//message.channel.send("I couldn't send the log to the correct channel and I don't have permissions to create it.");
			} else {
				await createChannel(member.guild, "admin", [{
					id: member.guild.id,
					deny: ["VIEW_CHANNEL"],
				}])
					.then(() => {
						const logChannel = member.guild.channels.cache.find(channel => channel.name === "admin");

						return logChannel.send(embedMsg);
					})
					.catch(err => {
						console.log(err);
					});
			}
		} else { // Channel already exists
			const logChannel = member.guild.channels.cache.find(channel => channel.name === "admin");

			return logChannel.send(embedMsg);
		}
	});

	client.on("guildCreate", async guild => {
		console.log(`Joined new guild: ${guild.name}`);

		const owner = await client.users.fetch(process.env.OWNERID);

		const embedMsg = new MessageEmbed()
			.setColor("GREEN")
			.setTimestamp()
			.setFooter(guild.name, guild.iconURL())
			.setAuthor("Joined server :)", guild.iconURL())
			.addField("Guild information", stripIndents`**\\> ID:** ${guild.id}
				**\\> Name:** ${guild.name}
				**\\> Member count:** ${guild.memberCount}
				**\\> Created at:** ${formatDateLong(guild.createdTimestamp)}
				**\\> Joined at:** ${formatDateLong(guild.joinedTimestamp)}`)
			.addField("Server owner information", stripIndents`**\\> ID:** ${guild.owner.user.id}
				**\\> Username:** ${guild.owner.user.username}
				**\\> Discord Tag:** ${guild.owner.user.tag}
				**\\> Created account:** ${formatDate(guild.owner.user.createdAt)}`, true);

		owner.send(embedMsg);
	});

	client.on("guildDelete", async guild => {
		console.log(`Left guild: ${guild.name}`);

		const owner = await client.users.fetch(process.env.OWNERID);

		const embedMsg = new MessageEmbed()
			.setColor("RED")
			.setTimestamp()
			.setFooter(guild.name, guild.iconURL())
			.setAuthor("Left server :(", guild.iconURL())
			.addField("Guild information", stripIndents`**\\> ID:** ${guild.id}
				**\\> Name:** ${guild.name}
				**\\> Member count:** ${guild.memberCount}
				**\\> Created at:** ${formatDateLong(guild.createdTimestamp)}
				**\\> Joined at:** ${formatDateLong(guild.joinedTimestamp)}`)
			.addField("Server owner information", stripIndents`**\\> ID:** ${guild.owner.user.id}
				**\\> Username:** ${guild.owner.user.username}
				**\\> Discord Tag:** ${guild.owner.user.tag}
				**\\> Created account:** ${formatDate(guild.owner.user.createdAt)}`, true);

		owner.send(embedMsg);
	})

	client.on("message", async message => {
		if (message.author.bot) return;  // if a bot sent the message

		/*
		// Will Sniper
		if(message.author.id === "94164958056558592") {
			if(message.attachments && !message.content) {
				const sentMessage = await message.channel.send("POST THE DAMN SOURCE REEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
				sentMessage.pin();
			}
		}
		*/
		/*
		// Josh Sniper
		if(message.author.id === "114848659891290118") {
			if(message.attachments && !message.content) {
				const sentMessage = await message.channel.send("@everyone POST THE DAMN SOURCE REEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
				sentMessage.pin();
			}
		}
		*/

		// If the message was not sent in a server
		if (!message.guild) {
			const owner = await client.users.fetch(process.env.OWNERID);
			const messageAuthor = message.author;
			const messageContent = message.content;
			const messageAttachments = message.attachments;

			const embedMsg = new MessageEmbed()
				.setColor("#0d6adb")
				.setTimestamp(message.createdAt)
				.setFooter(message.author.username, message.author.displayAvatarURL())
				.setDescription("Attempted DM")
				.addField("User information", stripIndents`**\\> ID:** ${message.author.id}
				**\\> Username:** ${message.author.username}
				**\\> Discord Tag:** ${message.author.tag}
				**\\> Created account:** ${formatDate(message.author.createdAt)}`, true);

			if (messageContent) {    // If there is text in the DM
				embedMsg.addField("Text:", messageContent)
			}
			if (messageAttachments.first()) { // If there is an attachment in the DM
				messageAttachments.forEach(attachment => {
					embedMsg.addField("Attachment:", attachment.url);
				});
				embedMsg.setImage(messageAttachments.first().url);
				/*
				let attachments = messageAttachments.find(attachment => attachment.id).url;
	
				embedMsg.addField("Attachments:", attachments)
				embedMsg.setImage(attachments);
				*/
			}

			owner.send(embedMsg);

			return message.channel.send("Message my master TundraBuddy#4650 instead!");
		}
		// Sent in a guild
		if (!message.content.startsWith(process.env.PREFIX)) return; // if the message did not contain the command prefix
		if (!message.member) message.member = await message.guild.members.fetch(message.member);

		// If we are waiting on a response from this member, skip the regular command handler
		if (client.waitingResponse.has(message.author.id)) return;

		const messageArray = message.content.split(" ");
		const cmd = messageArray[0].slice(process.env.PREFIX.length).toLowerCase();
		const args = messageArray.slice(1);

		if (cmd.length === 0) return;

		let command = client.commands.get(cmd); // Set the command to call
		if (!command) command = client.commands.get(client.aliases.get(cmd));    // If the command was not found, check aliases

		if (command) {
			try {
				command.run(client, message, args);
			} catch (err) {
				console.error("Error running command: ", err);
			}
		}
	});

	client.login(process.env.DISCORDTOKEN);
}

setup();