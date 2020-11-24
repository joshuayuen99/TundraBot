const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const Member = require("../../models/Member.js");

module.exports = {
    name: "unmute",
    category: "moderation",
    description: "Unmutes the member so they can talk and type again.",
    usage: "unmute <mention | id> [reason]",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        // No user specified
        if (!args[0]) {
            await message.reply(`Usage: \`${module.exports.usage}\``);
            return;
        }

        const reason = args.splice(1).join(" ");

        // No author permission
        if (!message.member.hasPermission("MUTE_MEMBERS" | "MANAGE_ROLES")) {
            return message.reply("Nice try guy, you don't have permission to unmute people.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        // No bot permission
        if (!message.guild.me.hasPermission("MUTE_MEMBERS" | "MANAGE_ROLES")) {
            return message.reply("I don't have permission to unmute people!")
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

        // If user isn't unmuteable (role difference)
        if (!mMember.manageable) {
            return message.reply("They can't be unmuted by the likes of you.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        // If user isn't muted
        if (!mMember.roles.cache.some(role => role.name === "tempmute")) {
            return message.reply("They aren't muted!");
        }

        module.exports.unmute(client, message.guild, settings, mMember, reason, message.member).then(() => {
            message.channel.send("Member muted!");
        }).catch((err) => {
            message.channel.send("Well... something went wrong?");
            console.error(err);
        });
    },
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Guild} guild Discord Guild object
     * @param {Object} settings guild settings
     * @param {import("discord.js").GuildMember} mMember Discord Guild member to unmute
     * @param {String} reason unmute reason
     * @param {import("discord.js").GuildMember} moderator Discord Guild member that issued the unmute
    */
    unmute: async (client, guild, settings, mMember, reason, moderator) => {
        const role = guild.roles.cache.find(role => role.name === "tempmute");

        mMember.roles.remove(role, reason).then(() => {
            if (mMember.voice.channel) mMember.voice.setMute(false);

            if (settings.logMessages.enabled) {
                // Log activity
                if (guild.channels.cache.some(channel => channel.id === settings.logMessages.channelID)) {
                    const logChannel = guild.channels.cache.find(channel => channel.id === settings.logMessages.channelID);

                    const embedMsg = new MessageEmbed()
                        .setColor("GREEN")
                        .setTitle("Unmute")
                        .setThumbnail(mMember.user.displayAvatarURL())
                        .setTimestamp();

                    if (moderator) {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Unmuted member:** ${mMember} (${mMember.id})
                                **\\> Unmuted by:** ${moderator}
                                **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Unmuted member:** ${mMember} (${mMember.id})
                                **\\> Unmuted by:** ${moderator}
                                **\\> Reason:** \`Not specified\``);
                        }
                        embedMsg.setFooter(moderator.displayName, moderator.user.displayAvatarURL());
                    } else {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Unmuted member:** ${mMember} (${mMember.id})
                                **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Unmuted member:** ${mMember} (${mMember.id})
                                **\\> Reason:** \`Not specified\``);
                        }
                    }

                    logChannel.send(embedMsg).catch((err) => {
                        // Most likely don't have permissions to type
                        //message.channel.send(`I don't have permission to log this in the configured log channel. Please give me permission to write messages there, or use \`${settings.prefix}config logChannel\` to change it.`);
                        console.error("Error sending unmute log message: ", err);
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

            // Remove mute from database
            Member.unmute({ userID: mMember.user.id, guildID: guild.id }).catch((err) => {
                console.error("Error unmuting member in database: ", err);
            });
        }).catch((err) => {
            console.error("Error unmuting member: ", err);

            // Remove mute from database
            Member.unmute({ userID: mMember.user.id, guildID: guild.id }).catch((err) => {
                console.error("Error unmuting member in database: ", err);
            });
        });
    }
};