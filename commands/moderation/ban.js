const { RichEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { promptMessage } = require("../../functions.js");

module.exports = {
    name: "ban",
    category: "moderation",
    decsription: "Bans the member",
    usage: "ban <mention | id> <reason>",
    run: async (client, message, args) => {
        const logChannel = message.guild.channels.find(channel => channel.name === "admin");

        if(message.deletable) message.delete();

        // No user specified
        if(!args[0]) {
            return message.reply("Please provide a user to ban.")
                .then(m => m.delete(5000));
        }

        // No reason specified
        if(!args[1]) {
            return message.reply("Please provide a reason to ban.")
                .then(m => m.delete(5000));
        }
        const reason = args.splice(1).join(" ");

        // No author permission
        if(!message.member.hasPermission("BAN_MEMBERS")) {
            return message.reply("Nice try guy, you don't have permission to ban people.")
                .then(m => m.delete(5000));
        }

        // No bot permission
        if(!message.guild.me.hasPermission("BAN_MEMBERS")) {
            return message.reply("I don't have permission to ban people!")
                .then(m => m.delete(5000));
        }

        const bMember = message.mentions.members.first() || message.guild.members.get(args[0]);

        // No member found
        if(!bMember) {
            return message.reply("Couldn't find that member, try again!")
                .then(m => m.delete(5000));
        }

        // Can't ban yourself
        if(bMember.id === message.author.id) {
            return message.reply("Don't ban yourself...It'll be alright.")
                .then(m => m.delete(5000));
        }

        // Can't ban bots
        if(bMember.user.bot) {
            return message.reply("Don't try to ban bots...")
                .then(m => m.delete(5000));
        }

        // If user isn't bannable (role difference)
        if(!bMember.bannable) {
            return message.reply("They can't be banned by the likes of you.")
                .then(m => m.delete(5000));
        }

        const embedMsg = new RichEmbed()
            .setColor("ff0000")
            .setThumbnail(bMember.user.displayAvatarURL)
            .setFooter(message.member.displayName, message.author.displayAvatarURL)
            .setTimestamp()
            .setDescription(stripIndents`**\\> Banned member:** ${bMember} (${bMember.id})
            **\\> Banned by:** ${message.member}
            **\\> Reason:** ${reason}`);

        const promptEmbed = new RichEmbed()
            .setColor("GREEN")
            .setAuthor("This verification becomes invalid after 30s")
            .setDescription(`Do you want to ban ${bMember}?`)
        message.channel.send(promptEmbed).then(async msg => {
            const emoji = await promptMessage(msg, message.author, 30, ["\u2611", "\u2716"]);

            if(emoji === "\u2611") {    // "Check" emoji
                msg.delete();

                bMember.ban(reason)
                    .catch(err => {
                        if(err) return message.channel.send("Well... something went wrong?");
                    });

                logChannel.send(embedMsg);
            } else if(emoji === "\u2716") { // "X" emoji
                msg.delete();

                message.reply("Ban cancelled...")
                    .then(m => m.delete(5000));
            }
        })
    }
};