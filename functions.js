module.exports = {
	getMember: function (message, toFind = '') {
		toFind = toFind.toLowerCase();

		let target = message.guild.members.cache.find(member => member == toFind);

		// If there is no target, but there is a mention in the message, use the first mention instead
		if (!target && message.mentions.members) {
			target = message.mentions.members.first();
		}

		// Searches for people in the server with a matching nickname or "name#tag"
		if (!target && toFind) {
			target = message.guild.members.cache.find(member => {
				return member.displayName.toLowerCase().includes(toFind) ||
					member.user.tag.toLowerCase().includes(toFind);
			});
		}

		// If no one is found that matches, return the callee
		if (!target) {
			target = message.member;
		}

		return target;
	},

	createChannel: async function (guild, name, permissions) {
		if (guild.channels.cache.some(channel => channel.name === name)) return;

		await guild.channels.create(name, {
			type: "text",
			permissionOverwrites: permissions,
		});
	},

	formatDate: function (date) {
		return new Intl.DateTimeFormat("en-US").format(date);
	},

	formatDateLong: function (date) {
		const options = {
			timeZone: "America/New_York",
			hour12: true,
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
		};
		return new Intl.DateTimeFormat("en-US", options).format(date);
	},

	promptMessage: async function (message, author, time, validReactions) {
		time *= 1000;   // Convert from s to ms

		async function setReactions() {
			for (const reaction of validReactions) message.react(reaction);
		}

		await setReactions();

		const filter = (reaction, user) => validReactions.includes(reaction.emoji.name) && user.id === author.id;

		return message
			.awaitReactions(filter, { max: 1, time: time })
			.then(collected => collected.first() && collected.first().emoji.name)
			.catch(err => {
				console.error("Error in promptMessage: ", err);
			});
    },
    
    waitPollResponse: async function (message, time, validReactions) {
        time *= 1000;   // Convert from s to ms

        async function setReactions() {
			for (const reaction of validReactions) message.react(reaction);
		}

        await setReactions();
        
        const filter = (reaction, user) => validReactions.includes(reaction.emoji.name);

        return message
        .awaitReactions(filter, { time: time })
        .then(collected => collected)
        .catch(err => {
            console.error("Error in waitPollResponse: ", err);
        });
    },

	waitResponse: async function (client, message, author, time) {
		client.waitingResponse.add(author.id);
		time *= 1000;   // Convert from s to ms

		const filter = msg => msg.author.id === author.id;

		return message.channel
			.awaitMessages(filter, { max: 1, time: time })
			.then((collected) => {
				client.waitingResponse.delete(author.id);
				return collected.first()
			})
			.catch(err => {
				console.error("Error in waitresponse: ", err);
			});
	},

    /**
     * Shuffles array in place.
     * @param {Array} a items An array containing the items.
     */
	shuffle: function (a) {
		var j, x, i;
		for (i = a.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = a[i];
			a[i] = a[j];
			a[j] = x;
		}
		return a;
	}
};