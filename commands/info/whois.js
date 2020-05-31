const { MessageEmbed } = require("discord.js");
const { getMember, formatDate } = require("../../functions.js");
const { stripIndents } = require("common-tags");

module.exports = {
    name: "whois",
    aliases: ["userinfo", "who"],
    category: "info",
    description: "Returns user information. If no one is specified, it will return user information about the person who used this command.",
    usage: "whois [username | id | mention]",
    run: async (client, message, args) => {
        const member = getMember(message, args.join(" "));

        // Member variables
        const joined = formatDate(member.joinedAt);
        const roles = member.roles.cache
            .filter(r => r.id !== message.guild.id) // Filters out the @everyone role
            .map(r => r)
            .join(", ") || "none";

        // User variables
        const created = formatDate(member.user.createdAt);

        const embedMsg = new MessageEmbed()
            .setFooter(member.displayName, member.user.displayAvatarURL())
            .setThumbnail(member.user.displayAvatarURL())
            .setColor(member.displayHexColor === "#000000" ? "ffffff" : member.displayHexColor)
            .setDescription(`${member}`)
            .setTimestamp()

            .addField("Member information", stripIndents`**\\> Display name:** ${member.displayName}
            **\\> Joined the server:** ${joined}
            **\\> Roles: ** ${roles}`, true)

            .addField("User information", stripIndents`**\\> ID:** ${member.user.id}
            **\\> Username:** ${member.user.username}
            **\\> Discord Tag:** ${member.user.tag}
            **\\> Created account:** ${created}`, true)

        // If the user is currently playing a game
        if (member.user.presence.game) {
            embedMsg.addField("Currently playing", stripIndents`**\\>** ${member.user.presence.game.name}`);
        }

        return message.channel.send(embedMsg);
    }
};