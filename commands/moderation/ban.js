const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { promptMessage } = require("../../functions.js");
const ms = require("ms");
const Member = require("../../models/Member.js");

module.exports = {
    name: "ban",
    category: "moderation",
    description: "Bans the member for an optional duration between 0-14 days.",
    usage: "ban <mention | id> [duration (#s/m/h/d)] [reason]",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const CONFIRM = "💯";
        //const CONFIRM = "\u1f4af";  // "100" emoji
        const CANCEL = "\u274c";    // red "X" emoji

        // No user specified
        if (!args[0]) {
            await message.reply(`Usage: \`${module.exports.usage}\``);
            return;
        }

        let duration;
        let reason;
        if (args[1]) {
            if (ms(args[1])) { // duration specified
                if (ms(args[1]) > 0 && ms(args[1]) <= ms("14 days")) {
                    duration = ms(args[1]);
                    reason = args.splice(2).join(" ");
                } else { // outside range
                    await message.reply("The duration must be between 0-14 days.");
                    return;
                }
            } else { // duration not specified
                duration = 0;
                reason = args.splice(1).join(" ");
            }
        } else {
            duration = 0;
            reason = "";
        }

        // No author permission
        if (!message.member.hasPermission("BAN_MEMBERS")) {
            await message.reply("Nice try guy, you don't have permission to ban people.")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        // No bot permission
        if (!message.guild.me.hasPermission("BAN_MEMBERS")) {
            await message.reply("I don't have permission to ban people!")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        const bMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        // No member found
        if (!bMember) {
            await message.reply("Couldn't find that member, try again!")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        // Can't ban yourself
        if (bMember.id === message.author.id) {
            await message.reply("Don't ban yourself...It'll be alright.")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        // Can't ban bots
        if (bMember.user.bot) {
            await message.reply("Don't try to ban bots...")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        // If user isn't bannable (role difference)
        if (!bMember.bannable) {
            await message.reply("They can't be banned by the likes of you.")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        const promptEmbed = new MessageEmbed()
            .setColor("GREEN")
            .setFooter("This verification becomes invalid after 30s")
            .setDescription(`Do you want to ban ${bMember} ${duration == 0 ? "permanently" : `for ${ms(duration, { long: true })}`}?`)
        message.channel.send(promptEmbed).then(async msg => {
            const emoji = await promptMessage(msg, message.author, 30, [CONFIRM, CANCEL]);

            if (emoji === CONFIRM) {
                msg.delete();

                await module.exports.ban(client, message.guild, settings, bMember, reason, duration, message.member).then(() => {
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

                message.reply("Ban cancelled...")
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
     * @param {import("discord.js").GuildMember} bMember Discord Guild member to ban
     * @param {String} reason ban reason
     * @param {Number} duration duration to ban for (0 for permanent)
     * @param {import("discord.js").GuildMember} moderator Discord Guild member that issued the ban
    */
    ban: async (client, guild, settings, bMember, reason, duration, moderator) => {
        bMember.ban({
            reason: reason,
        }).then(() => {
            if (settings.logMessages.enabled) {
                // Log activity
                if (guild.channels.cache.some(channel => channel.id === settings.logMessages.channelID)) {
                    const logChannel = guild.channels.cache.find(channel => channel.id === settings.logMessages.channelID);

                    const embedMsg = new MessageEmbed()
                        .setColor("RED")
                        .setTitle("Ban")
                        .setThumbnail(bMember.user.displayAvatarURL())
                        .setTimestamp();

                    if (moderator) {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Banned member:** ${bMember} (${bMember.id})
                            **\\> Banned by:** ${moderator}
                            **\\> Duration:** ${duration == 0 ? "Forever" : ms(duration, { long: true })}
                            **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Banned member:** ${bMember} (${bMember.id})
                            **\\> Banned by:** ${moderator}
                            **\\> Duration:** ${duration == 0 ? "Forever" : ms(duration, { long: true })}
                            **\\> Reason:** \`Not specified\``);
                        }
                        embedMsg.setFooter(moderator.displayName, moderator.user.displayAvatarURL());
                    } else {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Banned member:** ${bMember} (${bMember.id})
                            **\\> Duration:** ${duration == 0 ? "Forever" : ms(duration, { long: true })}
                            **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Banned member:** ${bMember} (${bMember.id})
                            **\\> Duration:** ${duration == 0 ? "Forever" : ms(duration, { long: true })}
                            **\\> Reason:** \`Not specified\``);
                        }
                    }

                    logChannel.send(embedMsg).catch((err) => {
                        // Most likely don't have permissions to type
                        //message.channel.send(`I don't have permission to log this in the configured log channel. Please give me permission to write messages there, or use \`${settings.prefix}config logChannel\` to change it.`);
                        console.error("Error sending ban log message: ", err);
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

            if (duration > 0) {
                const endTime = Date.now() + duration;

                Member.ban({ userID: bMember.user.id, guildID: guild.id }, endTime).then(() => {
                    setTimeout(() => {
                        module.exports.unban(client, guild, settings, bMember.user.id, "Ban duration expired", null);
                    }, duration);
                }).catch((err) => {
                    console.error("Error saving unban time to database: ", err);
                });
            }
        });

        return;
    },
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Guild} guild Discord Guild object
     * @param {Object} settings guild settings
     * @param {import("discord.js").GuildMember} bUserID Discord User ID to unban
     * @param {String} reason unban reason
     * @param {import("discord.js").GuildMember} moderator Discord Guild member that issued the ban
    */
    unban: async (client, guild, settings, bUserID, reason, moderator) => {
        guild.members.unban(bUserID, reason).then((user) => {
            if (settings.logMessages.enabled) {
                // Log activity
                if (guild.channels.cache.some(channel => channel.id === settings.logMessages.channelID)) {
                    const logChannel = guild.channels.cache.find(channel => channel.id === settings.logMessages.channelID);

                    const embedMsg = new MessageEmbed()
                        .setColor("GREEN")
                        .setTitle("Unban")
                        .setTimestamp();

                    if (moderator) {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Unbanned member:** ${user} (${user.id})
                            **\\> Unbanned by:** ${moderator}
                            **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Unbanned member:** ${user} (${user.id})
                            **\\> Unbanned by:** ${moderator}
                            **\\> Reason:** \`Not specified\``);
                        }
                        embedMsg.setFooter(moderator.displayName, moderator.user.displayAvatarURL());
                    } else {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Unbanned member:** ${user} (${user.id})
                            **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Unbanned member:** ${user} (${user.id})
                            **\\> Reason:** \`Not specified\``);
                        }
                    }

                    logChannel.send(embedMsg).catch((err) => {
                        // Most likely don't have permissions to type
                        //message.channel.send(`I don't have permission to log this in the configured log channel. Please give me permission to write messages there, or use \`${settings.prefix}config logChannel\` to change it.`);
                        console.error("Error sending ban log message: ", err);
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

            // Remove ban from database
            Member.unban({ userID: user.id, guildID: guild.id }).catch((err) => {
                console.error("Error unbanning member in database: ", err);
            });
        }).catch((err) => {
            console.error("Error unbanning user: ", err);

            // Remove ban from database
            Member.unban({ userID: bUserID, guildID: guild.id }).catch((err) => {
                console.error("Error unbanning member in database: ", err);
            });
        });

        return;
    }
};