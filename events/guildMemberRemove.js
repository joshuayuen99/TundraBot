const { MessageEmbed } = require("discord.js");
const { formatDateLong } = require("../functions.js");

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").GuildMember} member Discord Member
*/
module.exports = async (client, member) => {
    let settings;
    try {
        settings = await client.getGuild(member.guild);
    } catch (err) {
        console.error("guildMemberRemove event error: ", err);
    }

    // Leave messages are enabled
    if (settings.leaveMessages.enabled) {
        const guild = member.guild;
        const micon = member.user.displayAvatarURL();
    
        const embedMsg = new MessageEmbed()
            .setDescription(`${member.user} (${member.user.tag}) left the server`)
            .setColor("RED")
            .setThumbnail(micon)
            .addField(`${member.user.username} joined`, `${formatDateLong(member.joinedAt)} EST`)
            .addField("New total members", guild.memberCount)
            .setTimestamp();

        if (guild.channels.cache.some(channel => channel.id === settings.leaveMessages.channelID)) {
            let logChannel = guild.channels.cache.find(channel => channel.id === settings.leaveMessages.channelID);

            if (!logChannel.permissionsFor(client.user).has("SEND_MESSAGES")) {
                // TODO: check in dashboard
                return;
            }
            logChannel.send(embedMsg);
        }
    }
}