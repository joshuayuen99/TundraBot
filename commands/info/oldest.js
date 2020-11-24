const { MessageEmbed } = require("discord.js");
const { formatDate, formatDateLong } = require("../../functions.js");
const { stripIndents } = require("common-tags");

module.exports = {
    name: "oldest",
    category: "info",
    description: "Returns information about the oldest member or user(account) of the server.",
    usage: "oldest <member | user | account>",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        if (!args[0]) {
            await message.reply(`Please specify "member", "user", or "account" as an argument`)
                .then(m => m.delete({
                    timeout: 5000
                }));
            if (message.deletable) message.delete();
            return;
        }
        let member = message.member;
        if (args[0] === "member") {
            let oldestDate = message.createdAt;
            let oldestMember;
            message.guild.members.cache.forEach(member => {
                if (member.joinedAt < oldestDate && member.user.id !== message.guild.ownerID) {
                    oldestDate = member.joinedAt;
                    oldestMember = member;
                }
            })
            member = oldestMember;
        } else if (args[0] === "user" || args[0] === "account") {
            let oldestDate = message.author.createdAt;
            let oldestMember = message.member;
            message.guild.members.cache.forEach(member => {
                if (member.user.createdAt < oldestDate) {
                    oldestDate = member.user.createdAt;
                    oldestMember = member;
                }
            })
            member = oldestMember;
        }

        // Member variables
        const joined = formatDateLong(member.joinedAt);
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

        await message.channel.send(embedMsg);
        if (message.deletable) message.delete();
    }
};