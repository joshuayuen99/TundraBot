const { RichEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { promptMessage } = require("../../functions.js");

module.exports = {
    name: "kick",
    category: "moderation",
    decsription: "Kicks the member",
    usage: "kick <mention | id> <reason>",
    run: async (client, message, args) => {
        const logChannel = message.guild.channels.find(channel => channel.name === "admin");

        if(message.deletable) message.delete();

        // No user specified
        if(!args[0]) {
            return message.reply("Please provide a user to kick.")
                .then(m => m.delete(5000));
        }

        // No reason specified
        if(!args[1]) {
            return message.reply("Please provide a reason to kick.")
                .then(m => m.delete(5000));
        }

        // No author permission
        if(!message.member.hasPermission("KICK_MEMBERS")) {
            return message.reply("You do not have permission to kick members!")
                .then(m => m.delete(5000));
        }

        // No bot permission
        if(!message.guild.me.hasPermission("KICK_MEMBERS")) {
            return message.reply("I do not have permission to kick members!")
                .then(m => m.delete(5000));
        }

        const kMember = message.mentions.members.first() || message.guild.members.get(args[0]);

        // No member found
        if(!kMember) {
            return message.reply("Couldn't find that member, try again!")
                .then(m => m.delete(5000));
        }

        // Can't kick yourself
        if(kMember.id === message.author.id) {
            return message.reply("Don't kick yourself...")
                .then(m => m.delete(5000));
        }

        // Can't kick bots
        if(kMember.user.bot) {
            return message.reply("Don't kick bots...")
                .then(m => m.delete(5000));
        }

        // If user isn't kickable (role difference)
        if(!kMember.kickable) {
            return message.reply("That user isn't kickable!")
                .then(m => m.delete(5000));
        }

        const embedMsg = new RichEmbed()
            .setColor("ff0000")
            .setThumbnail(kMember.user.displayAvatarURL)
            .setFooter(message.member.displayName, message.author.displayAvatarURL)
            .setTimestamp()
            .setDescription(stripIndents`**\\> Kicked member:** ${kMember} (${kMember.id})
            **\\> Kicked by:** ${message.member}
            **\\> Reason:** ${args.splice(1).join(" ")}`);

        const promptEmbed = new RichEmbed()
            .setColor("GREEN")
            .setAuthor("This verification becomes invalid after 30s")
            .setDescription(`Do you want to kick ${kMember}?`)
        message.channel.send(promptEmbed).then(async msg => {
            const emoji = await promptMessage(msg, message.author, 30, ["\u2611", "\u2716"]);

            if(emoji === "\u2611") {    // "Check" emoji
                msg.delete();

                kMember.kick(args.slice(1).join(" "))
                    .catch(err => {
                        if(err) return message.channel.send("Well... something went wrong?");
                    });

                logChannel.send(embedMsg);
            } else if(emoji === "\u2716") { // "X" emoji
                msg.delete();

                message.reply("Kick canceled...")
                    .then(m => m.delete(5000));
            }
        })
    }
};