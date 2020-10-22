const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { createChannel, promptMessage } = require("../../functions.js");

module.exports = {
    name: "kick",
    category: "moderation",
    description: "Kicks the member.",
    usage: "kick <mention | <id> <reason>",
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
            await message.reply("Please provide a user to kick.")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }

        // No reason specified
        if (!args[1]) {
            await message.reply("Please provide a reason to kick.")
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
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

        const kMember = message.mentions.members.first() || message.guild.members.get(args[0]);

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

        const embedMsg = new MessageEmbed()
            .setColor("RED")
            .setThumbnail(kMember.user.displayAvatarURL())
            .setFooter(message.member.displayName, message.author.displayAvatarURL())
            .setTimestamp()
            .setDescription(stripIndents`**\\> Kicked member:** ${kMember} (${kMember.id})
            **\\> Kicked by:** ${message.member}
            **\\> Reason:** ${reason}`);

        const promptEmbed = new MessageEmbed()
            .setColor("GREEN")
            .setAuthor("This verification becomes invalid after 30s")
            .setDescription(`Do you want to kick ${kMember}?`)
        message.channel.send(promptEmbed).then(async msg => {
            const emoji = await promptMessage(msg, message.author, 30, [CONFIRM, CANCEL]);

            if (emoji === CONFIRM) {
                msg.delete();

                // Log activity and create channel if necessary
                if (!message.guild.channels.cache.some(channel => channel.name === settings.logChannel)) {
                    if (!message.guild.me.hasPermission("MANAGE_CHANNELS")) {
                        message.channel.send("I couldn't send the log to the correct channel and I don't have permissions to create it.");
                    } else {
                        await createChannel(message.guild, settings.logChannel, [{
                            id: message.guild.id,
                            deny: ["VIEW_CHANNEL"],
                        }, {
                            id: client.user.id,
                            allow: ["VIEW_CHANNEL"]
                        }]).then(() => {
                            const logChannel = message.guild.channels.cache.find(channel => channel.name === settings.logChannel);

                            logChannel.send(embedMsg);
                            if (message.deletable) message.delete();                            
                        })
                            .catch(err => {
                                console.error("kick command create log channel error: ", err);
                                if (message.deletable) message.delete();
                            });;
                    }
                } else { // Channel already exists
                    const logChannel = message.guild.channels.cache.find(channel => channel.name === settings.logChannel);

                    logChannel.send(embedMsg);
                    if (message.deletable) message.delete();
                }

                // Kick after potentially creating the logging channel to avoid it happening twice (once in member leave event as well)
                kMember.kick(reason)
                    .catch(err => {
                        if (err) {
                            message.channel.send("Well... something went wrong?");
                            if (message.deletable) message.delete();
                        }
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
    }
};