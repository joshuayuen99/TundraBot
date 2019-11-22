const { RichEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");

module.exports = {
    name: "report",
    category: "moderation",
    description: "Reports a member",
    usage: "report <mention | id> <reason>",
    run: async (client, message, args) => {
        if(message.deletable) message.delete();

        let rMember = message.mentions.members.first() || message.guild.members.get(args[0]);

        // If the reported member couldn't be found
        if(!rMember)
            return message.reply("Couldn't find that person.").then(m => m.delete(5000));

        // If the reported member has permission to ban, or is a bot
        if(rMember.hasPermission("BAN_MEMBERS") || rMember.user.bot)
            return message.reply("They can't be reported by the likes of you.").then(m => m.delete(5000));
        
        // If there was no reason specified
        if(!args[1])
            return message.reply("Please specify a reason for the report.").then(m => m.delete(5000));

        const channel = message.guild.channels.find(channel => channel.name === "admin");

        if(!channel)
            return message.channel.send("I couldn't find the #admin channel.").then(m => m.delete(5000));

        const embedMsg = new RichEmbed()
            .setColor("#ff0000")
            .setTimestamp()
            .setFooter(message.guild.name, message.guild.iconURL)
            .setAuthor("Reported member", rMember.user.displayAvatarURL)
            .setDescription(stripIndents`**\\> Member:** ${rMember} (${rMember.id})
            **\\> Reported by:** ${message.member} (${message.member.id})
            **\\> Reported in:** ${message.channel}
            **\\> Reason:** ${args.slice(1).join(" ")}`);

        return channel.send(embedMsg);
    }
};