const { MessageEmbed } = require("discord.js");
const { getMember, formatDate } = require("../../functions.js");
const { stripIndents } = require("common-tags");

module.exports = {
    name: "whois",
    aliases: ["userinfo", "who"],
    category: "info",
    description: "Returns user information. If no one is specified, it will return user information about the person who used this command.",
    usage: "whois [username | id | mention]",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
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

        // User activities
        for (let activity of member.user.presence.activities) {
            switch (activity.type) {
                case "PLAYING":
                    embedMsg.addField("Playing", stripIndents`**\\>** ${activity.name}`);
                    break;
                case "STREAMING":
                    embedMsg.addField(`Streaming on ${activity.name}`, stripIndents`**\\>** ${activity.state}
                    **\\>** [${activity.details}](${activity.url})`);
                    break;
                case "LISTENING":
                    embedMsg.addField(`Listening to ${activity.name}`, stripIndents`**\\> Song:** ${activity.details}
                    **\\> Artist:** ${activity.state}`);
                    break;
                case "WATCHING":
                    embedMsg.addField("Watching", stripIndents`**\\>** ${activity.name}`);
                    break;
                case "CUSTOM_STATUS":
                    let statusString = "";
                    if (activity.emoji) {
                        statusString += activity.emoji.name;
                        if (activity.state) {
                            statusString += ` ${activity.state}`;
                        }
                    }
                    else statusString += activity.state;
                    embedMsg.addField("Custom status", stripIndents`**\\>** ${statusString}`);
                    break;
                default:
                    break;
            }
        }

        return message.channel.send(embedMsg);
    }
};