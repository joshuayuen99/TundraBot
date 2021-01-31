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

    /**
     * @param {import("discord.js").Guild} guild Discord Guild
     * @param {String} name Name of the new channel
     * @param {import("discord.js").GuildCreateChannelOptions} permissions Permissions for the new channel
     * @returns {Promise<import("discord.js").TextChannel>} Guild text channel
    */
    createChannel: async function (guild, name, permissions) {
        if (guild.channels.cache.some(channel => (channel.type === "text" && channel.name === name))) {
            return guild.channels.cache.find(channel => (channel.type === "text" && channel.name === name));
        }

        return guild.channels.create(name, {
            type: "text",
            permissionOverwrites: permissions,
        });
    },

    /**
     * @param {import("discord.js").Guild} guild Discord Guild
     * @param {String} name Name of the new role
     * @param {import("discord.js").GuildCreateChannelOptions} permissions Permissions for the new role
     * @returns {Promise<import("discord.js").Role>} Guild role
    */
    createRole: async function (guild, name, permissions) {
        if (guild.roles.cache.some(role => role.name === name)) {
            return guild.roles.cache.find(role => role.name === name);
        }

        return guild.roles.create({
            data: {
                name: name,
                permissions: permissions
            }
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
            for (const reaction of validReactions) {
                message.react(reaction).catch((err) => {
                    message.channel.send("I had trouble reacting with those emojis...");
                    console.error("promptMessage error: ", err);
                });
            }
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

    waitResponse: async function (client, message, author, time) {
        client.waitingResponse.add(author.id);
        time *= 1000;   // Convert from s to ms

        const filter = msg => msg.author.id === author.id;

        return message.channel
            .awaitMessages(filter, { max: 1, time: time })
            .then((collected) => {
                setTimeout(() => {
                    client.waitingResponse.delete(author.id);
                }, 1000);
                return collected.first()
            })
            .catch(err => {
                console.error("Error in waitResponse: ", err);
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