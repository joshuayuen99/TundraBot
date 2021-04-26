const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { promptMessage } = require("../../functions.js");

module.exports = {
    name: "kick",
    category: "moderation",
    description: "Kicks the member.",
    usage: "kick <mention | id> [reason]",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        //const CONFIRM = "\u2611"; // Checkmark emoji
        const CONFIRM = "💯";
        //const CONFIRM = "\u1f4af";  // "100" emoji
        const CANCEL = "\u274c";    // red "X" emoji

        // No user specified
        if (!args[0]) {
            await message.reply(`Usage: \`${module.exports.usage}\``);
            return;
        }

        const reason = args.splice(1).join(" ");

        // No author permission
        if (!message.member.hasPermission("KICK_MEMBERS")) {
            await message.reply("Nice try guy, you don't have permission to kick people.")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        // No bot permission
        if (!message.guild.me.hasPermission("KICK_MEMBERS")) {
            await message.reply("I don't have permission to kick people!")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        const kMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        // No member found
        if (!kMember) {
            await message.reply("Couldn't find that member, try again!")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        // Can't kick yourself
        if (kMember.id === message.author.id) {
            await message.reply("Don't kick yourself...It'll be alright.")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        // Can't kick bots
        if (kMember.user.bot) {
            await message.reply("Don't try to kick bots...")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        // If user isn't kickable (role difference)
        if (!kMember.kickable) {
            await message.reply("They can't be kicked by the likes of you.")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        const promptEmbed = new MessageEmbed()
            .setColor("GREEN")
            .setFooter("This verification becomes invalid after 30s")
            .setDescription(`Do you want to kick ${kMember}?`)
        message.channel.send(promptEmbed).then(async msg => {
            const emoji = await promptMessage(msg, message.author, 30, [CONFIRM, CANCEL]);

            if (emoji === CONFIRM) {
                msg.delete();

                await module.exports.kick(client, message.guild, settings, kMember, reason, message.member).then(() => {
                    if (message.deletable) message.delete();
                }).catch((err) => {
                    message.channel.send("Well... something went wrong?");
                    console.error(err);
                    if (message.deletable) message.delete();
                });
                return;
            } else if (emoji === CANCEL) {
                msg.delete();
                if (message.deletable) message.delete();

                message.reply("Kick cancelled...")
                    .then(m => m.delete({
                        timeout: 5000
                    }));
            }
        })
    },
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Guild} guild Discord Guild object
     * @param {Object} settings guild settings
     * @param {import("discord.js").GuildMember} kMember Discord Guild member to kick
     * @param {String} reason kick reason
     * @param {import("discord.js").GuildMember} moderator Discord Guild member that issued the kick
    */
    kick: async (client, guild, settings, kMember, reason, moderator) => {
        kMember.kick(reason).then(() => {
            if (settings.logMessages.enabled) {
                // Log activity
                if (guild.channels.cache.some(channel => channel.id === settings.logMessages.channelID)) {
                    const logChannel = guild.channels.cache.find(channel => channel.id === settings.logMessages.channelID);

                    const embedMsg = new MessageEmbed()
                        .setColor("RED")
                        .setTitle("Kick")
                        .setThumbnail(kMember.user.displayAvatarURL())
                        .setTimestamp();

                    if (moderator) {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Kicked member:** ${kMember} (${kMember.id})
                                **\\> Kicked by:** ${moderator}
                                **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Kicked member:** ${kMember} (${kMember.id})
                                **\\> Kicked by:** ${moderator}
                                **\\> Reason:** \`Not specified\``);
                        }
                        embedMsg.setFooter(moderator.displayName, moderator.user.displayAvatarURL());
                    } else {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Kicked member:** ${kMember} (${kMember.id})
                                **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Kicked member:** ${kMember} (${kMember.id})
                                **\\> Reason:** \`Not specified\``);
                        }
                    }

                    logChannel.send(embedMsg).catch((err) => {
                        // Most likely don't have permissions to type
                        //message.channel.send(`I don't have permission to log this in the configured log channel. Please give me permission to write messages there, or use \`${settings.prefix}config logChannel\` to change it.`);
                        console.error("Error sending kick log message: ", err);
                    });
                } else { // channel was removed, disable logging in settings
                    client.updateGuild(guild, {
                        logMessages: {
                            enabled: false,
                            channelID: null
                        }
                    });
                }
            }
        });

        return;
    }
};