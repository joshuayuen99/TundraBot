const {
    Client,
    GuildEmoji,
    Message,
    MessageEmbed,
    MessageReaction,
    User,
} = require("discord.js");

const axios = require("axios");

module.exports = {
    name: "stealemoji",
    aliases: ["steal"],
    category: "utility",
    description: "Steal emojis for this server by reacting with them.",
    usage: "steal [emoji name]",
    botPermissions: ["MANAGE_EMOJIS"],
    memberPermissions: ["MANAGE_EMOJIS"],
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
     */
    run: async (client, message, args, settings) => {
        if (!message.guild.me.hasPermission("MANAGE_EMOJIS")) {
            const embedMsg = new MessageEmbed()
                .setTitle("Error")
                .setDescription(
                    "I must have the `MANAGE_EMOJIS` permission to use this command. Contact your server admins to give me permission."
                )
                .setColor("RED")
                .setFooter(message.author.username, message.author.avatarURL());

            message.channel.send(embedMsg);

            return;
        }

        if (!message.member.hasPermission("MANAGE_EMOJIS")) {
            const embedMsg = new MessageEmbed()
                .setTitle("Error")
                .setDescription(
                    "You must have the `MANAGE_EMOJIS` permission to use this command."
                )
                .setColor("RED")
                .setFooter(message.author.username, message.author.avatarURL());

            message.channel.send(embedMsg);

            return;
        }

        const embedMsg = new MessageEmbed()
            .setTitle("Emoji Stealer")
            .setDescription(
                `To steal an emoji and upload it to this server${args[0] ? ` with the name \`${args[0]}\`` : ""}, react to this message with it.`
            )
            .setColor("GREEN")
            .setFooter("This stealer becomes invalid after 60s");

        message.channel.send(embedMsg).then(async (embedMessage) => {
            // add member to list of people currently stealing emojis
            client.activeEmojiStealing.add(
                `${message.guild.id}${message.author.id}`
            );

            return embedMessage
                .awaitReactions(filter, { max: 1, time: 60 * 1000 })
                .then(async (collected) => {
                    const reactions = collected.filter((emoji) =>
                        emoji.users.cache.has(message.author.id)
                    );
                    if (reactions.size < 1) {
                        message.reply(
                            "You're supposed to add a custom emoji..."
                        );

                        return;
                    }

                    for (const [, reaction] of reactions) {
                        message.guild.emojis
                            .create(
                                (
                                    await axios.get(reaction.emoji.url, {
                                        responseType: "arraybuffer",
                                    })
                                ).data,
                                args[0] || reaction.emoji.name,
                                { reason: `Stolen by: ${message.author.tag}` }
                            )
                            .then(() => {
                                message.reply("done.");
                            })
                            .catch((err) => {
                                message.channel.send(
                                    `Could not upload emoji: \`${args[0] || reaction.emoji.name}\``
                                );

                                console.error(
                                    `Could not upload emoji: ${args[0] || reaction.emoji.name} (${reaction.emoji.id}): ${err}`
                                );
                            });
                    }

                    return;
                })
                .catch((err) => {
                    message.reply("Something went wrong.");
                    console.error("Error stealing emoji: ", err);
                })
                .finally(() => {
                    // remove member from list of people currently stealing emojis
                    client.activeEmojiStealing.delete(
                        `${message.guild.id}${message.author.id}`
                    );
                });
        });
    },
};

function filter(reaction, user) {
    if (!reaction.emoji.url) return false; // Emoji won't be uploadable
    if (reaction.partial) {
        reaction.fetch().then((r) => {
            const emoji = r.emoji;

            if (emoji.guild.id === r.message.guild.id) return false; // Emoji is from this guild

            return true;
        });
    } else {
        const emoji = reaction.emoji;
        if (!emoji.guild) return true; // reaction comes from a server we don't know about (MessageReaction)
        if (emoji.guild.id && emoji.guild.id === reaction.message.guild.id)
            return false; // Emoji is from this guild

        return true;
    }
}
