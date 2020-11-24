const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { promptMessage } = require("../../functions.js");
const ms = require("ms");
const Member = require("../../models/Member.js");
const { unmute } = require("./unmute.js");

module.exports = {
    name: "mute",
    aliases: ["tempmute"],
    category: "moderation",
    description: "Temporarily mutes the member so they can't talk or type for an optional duration between 0-14 days.",
    usage: `mute <mention | id> [duration (#s/m/h/d)] [reason]
    eg. mute @TundraBot 10m`,
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        const CONFIRM = "💯";
        const CANCEL = "\u274c";    // red "X" emoji

        // No user specified
        if (!args[0]) {
            await message.reply(stripIndents`Usage: \`${module.exports.usage}\``);
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
        if (!message.member.hasPermission("MUTE_MEMBERS" | "MANAGE_ROLES")) {
            return message.reply("Nice try guy, you don't have permission to mute people.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        // No bot permission
        if (!message.guild.me.hasPermission("MUTE_MEMBERS" | "MANAGE_ROLES")) {
            return message.reply("I don't have permission to mute people!")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        const mMember = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

        // No member found
        if (!mMember) {
            return message.reply("Couldn't find that member, try again!")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        // Can't mute yourself
        if (mMember.id === message.author.id) {
            return message.reply("Don't mute yourself...It'll be alright.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        // Can't mute bots
        if (mMember.user.bot) {
            return message.reply("Don't try to mute bots...")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        // If user isn't muteable (role difference)
        if (!mMember.manageable) {
            return message.reply("They can't be muted by the likes of you.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        const promptEmbed = new MessageEmbed()
            .setColor("GREEN")
            .setAuthor("This verification becomes invalid after 30s")
            .setDescription(`Do you want to mute ${mMember} ${duration == 0 ? "permanently" : `for ${ms(duration, { long: true })}`}?`)
        message.channel.send(promptEmbed).then(async msg => {
            const emoji = await promptMessage(msg, message.author, 30, [CONFIRM, CANCEL]);

            if (emoji === CONFIRM) {
                msg.delete();

                await module.exports.mute(client, message.guild, settings, mMember, reason, duration, message.member).then(() => {
                    message.channel.send("Member muted!");
                }).catch((err) => {
                    message.channel.send("Well... something went wrong?");
                    console.error(err);
                });
                return;
            } else if (emoji === CANCEL) {
                msg.delete();

                message.reply("Not muting after all...")
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
     * @param {import("discord.js").GuildMember} mMember Discord Guild member to mute
     * @param {String} reason mute reason
     * @param {Number} duration duration to mute for (0 for permanent)
     * @param {import("discord.js").GuildMember} moderator Discord Guild member that issued the mute
    */
    mute: async (client, guild, settings, mMember, reason, duration, moderator) => {
        // If the role doesn't already exist, make it
        if (!guild.roles.cache.some(role => role.name === "tempmute")) {
            await guild.roles.create({
                data: {
                    name: "tempmute",
                    mentionable: false,
                }
            });
        }

        const role = guild.roles.cache.find(role => role.name === "tempmute");

        // Set channel overwrites for the role
        guild.channels.cache.forEach(channel => {
            channel.createOverwrite(role, {
                SEND_MESSAGES: false,
                SPEAK: false,
            });
        });

        mMember.roles.add(role).then(() => {
            if (mMember.voice.channel) mMember.voice.setMute(true);

            if (settings.logMessages.enabled) {
                // Log activity
                if (guild.channels.cache.some(channel => channel.id === settings.logMessages.channelID)) {
                    const logChannel = guild.channels.cache.find(channel => channel.id === settings.logMessages.channelID);

                    const embedMsg = new MessageEmbed()
                        .setColor("PURPLE")
                        .setTitle("Mute")
                        .setThumbnail(mMember.user.displayAvatarURL())
                        .setTimestamp();

                    if (moderator) {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Muted member:** ${mMember} (${mMember.id})
                                **\\> Muted by:** ${moderator}
                                **\\> Duration:** ${duration == 0 ? "Forever" : ms(duration, { long: true })}
                                **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Muted member:** ${mMember} (${mMember.id})
                                **\\> Muted by:** ${moderator}
                                **\\> Duration:** ${duration == 0 ? "Forever" : ms(duration, { long: true })}
                                **\\> Reason:** \`Not specified\``);
                        }
                        embedMsg.setFooter(moderator.displayName, moderator.user.displayAvatarURL());
                    } else {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Muted member:** ${mMember} (${mMember.id})
                                **\\> Duration:** ${duration == 0 ? "Forever" : ms(duration, { long: true })}
                                **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Muted member:** ${mMember} (${mMember.id})
                                **\\> Duration:** ${duration == 0 ? "Forever" : ms(duration, { long: true })}
                                **\\> Reason:** \`Not specified\``);
                        }
                    }

                    logChannel.send(embedMsg).catch((err) => {
                        // Most likely don't have permissions to type
                        //message.channel.send(`I don't have permission to log this in the configured log channel. Please give me permission to write messages there, or use \`${settings.prefix}config logChannel\` to change it.`);
                        console.error("Error sending mute log message: ", err);
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

                Member.mute({ userID: mMember.user.id, guildID: guild.id }, endTime).then(() => {
                    setTimeout(() => {
                        unmute(client, guild, settings, mMember, "Mute duration expired", moderator);
                    }, duration);
                }).catch((err) => {
                    console.error("Error saving unmute time to database: ", err);
                });
            }
        });
    }
};