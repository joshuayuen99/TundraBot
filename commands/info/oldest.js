const { RichEmbed } = require("discord.js");
const { getMember, formatDate, formatDateLong } = require("../../functions.js");
const { stripIndents } = require("common-tags");

module.exports = {
    name: "oldest",
    category: "info",
    description: "Returns information about the oldest member of the server.",
    usage: "oldest",
    run: async (client, message, args) => {
        let oldestDate = message.createdAt;
        let oldestMember;
        message.guild.members.forEach(member => {
            console.log(member.displayName);
            if(member.joinedAt < oldestDate && member.user.id !== message.guild.ownerID) {
                oldestDate = member.joinedAt;
                oldestMember = member;
            }
        })
        const member = oldestMember;

        // Member variables
        const joined = formatDateLong(member.joinedAt);
        const roles = member.roles
            .filter(r => r.id !== message.guild.id) // Filters out the @everyone role
            .map(r => r)
            .join(", ") || "none";

        // User variables
        const created = formatDate(member.user.createdAt);

        const embedMsg = new RichEmbed()
            .setFooter(member.displayName, member.user.displayAvatarURL)
            .setThumbnail(member.user.displayAvatarURL)
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
        if(member.user.presence.game) {
            embedMsg.addField("Currently playing", stripIndents`**\\>** ${member.user.presence.game.name}`);
        }

        return message.channel.send(embedMsg);
    }
};