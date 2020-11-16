const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { createChannel, promptMessage } = require("../../functions.js");
const ms = require("ms");

module.exports = {
    name: "mute",
    aliases: ["tempmute"],
    category: "moderation",
    description: "Temporarily mutes the member for the specified duration so they can't talk or type.",
    usage: `mute <mention | id> <duration (#s/m/h)>
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
            return message.reply("Please provide a user to mute.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        // No time specified
        if (!args[1]) {
            return message.reply("Please provide a duration to mute for.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }
        const duration = args[1];

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

        // Can't ban yourself
        if (mMember.id === message.author.id) {
            return message.reply("Don't mute yourself...It'll be alright.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        // Can't ban bots
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

        const embedMsg = new MessageEmbed()
            .setColor("PURPLE")
            .setThumbnail(mMember.user.displayAvatarURL())
            .setFooter(message.member.displayName, message.author.displayAvatarURL())
            .setTimestamp()
            .setDescription(stripIndents`**\\> Muted member:** ${mMember} (${mMember.id})
            **\\> Muted by:** ${message.member}
            **\\> Duration:** ${duration}`);

        const promptEmbed = new MessageEmbed()
            .setColor("GREEN")
            .setAuthor("This verification becomes invalid after 30s")
            .setDescription(`Do you want to mute ${mMember} for ${duration}?`)
        message.channel.send(promptEmbed).then(async msg => {
            const emoji = await promptMessage(msg, message.author, 30, [CONFIRM, CANCEL]);

            if (emoji === CONFIRM) {
                msg.delete();

                // If the role doesn't already exist, make it
                if (!message.guild.roles.cache.some(role => role.name === "tempmute")) {
                    await message.guild.roles.create({
                        data: {
                            name: "tempmute",
                            mentionable: false,
                        }
                    });
                }

                const role = message.guild.roles.cache.find(role => role.name === "tempmute");

                // Set channel overwrites for the role
                message.guild.channels.cache.forEach(channel => {
                    channel.createOverwrite(role, {
                        SEND_MESSAGES: false,
                        SPEAK: false,
                    });
                });

                mMember.roles.add(role);
                if (mMember.voice.channel) mMember.voice.setMute(true);

                if (settings.logMessages.enabled) {
                    // Log activity
                    if (message.guild.channels.cache.some(channel => channel.id === settings.logMessages.channelID)) {
                        const logChannel = message.guild.channels.cache.find(channel => channel.id === settings.logMessages.channelID);

                        logChannel.send(embedMsg).catch((err) => {
                            // Most likely don't have permissions to type
                            message.channel.send(`I don't have permission to log this in the configured log channel. Please give me permission to write messages there, or use \`${settings.prefix}config logChannel\` to change it.`);
                        });
                    } else { // channel was removed, disable logging in settings
                        client.updateGuild(message.guild, {
                            logChannel: {
                                enabled: false,
                                channelID: null
                            }
                        });
                    }
                }

                // Remove role after duration
                setTimeout(() => {
                    mMember.roles.remove(role);
                    if (mMember.voice.channel) mMember.voice.setMute(false);
                }, ms(duration))
            } else if (emoji === CANCEL) {
                msg.delete();

                message.reply("Not muting after all...")
                    .then(m => m.delete({
                        timeout: 5000
                    }));
            }
        })
    }
};