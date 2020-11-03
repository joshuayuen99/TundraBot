const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { createChannel, promptMessage } = require("../../functions.js");
const { defaultGuildSettings: defaults } = require("../../config");

module.exports = {
    name: "ban",
    category: "moderation",
    description: "Bans the member.",
    usage: "ban <mention | id> <reason>",
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
            await message.reply("Please provide a user to ban.")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        // No reason specified
        if (!args[1]) {
            await message.reply("Please provide a reason to ban.")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }
        const reason = args.splice(1).join(" ");

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

        const bMember = message.mentions.members.first() || message.guild.members.get(args[0]);

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

        const embedMsg = new MessageEmbed()
            .setColor("RED")
            .setThumbnail(bMember.user.displayAvatarURL())
            .setFooter(message.member.displayName, message.author.displayAvatarURL())
            .setTimestamp()
            .setDescription(stripIndents`**\\> Banned member:** ${bMember} (${bMember.id})
            **\\> Banned by:** ${message.member}
            **\\> Reason:** ${reason}`);

        const promptEmbed = new MessageEmbed()
            .setColor("GREEN")
            .setAuthor("This verification becomes invalid after 30s")
            .setDescription(`Do you want to ban ${bMember}?`)
        message.channel.send(promptEmbed).then(async msg => {
            const emoji = await promptMessage(msg, message.author, 30, [CONFIRM, CANCEL]);

            if (emoji === CONFIRM) {
                msg.delete();

                if (settings.logChannel.enabled) {
                    // Log activity
                    if (message.guild.channels.cache.some(channel => channel.id === settings.logChannel.channelID)) {
                        const logChannel = message.guild.channels.cache.find(channel => channel.id === settings.logChannel.channelID);

                        logChannel.send(embedMsg).catch((err) => {
                            // Most likely don't have permissions to type
                            message.channel.send(`I don't have permission to log this in the configured log channel. Please give me permission to write messages there, or use \`${settings.prefix}config logChannel\` to change it.`);
                        });
                        if (message.deletable) message.delete();
                    } else { // channel was removed, disable logging in settings
                        client.updateGuild(message.guild, {
                            logChannel: {
                                enabled: false,
                                channelID: null
                            }
                        });
                    }
                }

                // Ban after logging
                bMember.ban(reason)
                    .catch(err => {
                        if (err) {
                            message.channel.send("Well... something went wrong?");
                            if (message.deletable) message.delete();
                        }
                    });
            } else if (emoji === CANCEL) {
                msg.delete();
                if (message.deletable) message.delete();

                message.reply("Ban cancelled...")
                    .then(m => m.delete({
                        timeout: 5000
                    }));
            }
        })
    }
};