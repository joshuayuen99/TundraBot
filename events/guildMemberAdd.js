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
        console.error("guildMemberAdd event error: ", err);
    }

    // Join messages are enabled
    if (settings.joinMessages.enabled) {
        const guild = member.guild;
        const micon = member.user.displayAvatarURL();

        const embedMsg = new MessageEmbed()
            .setDescription(`${member.user.username} joined the server`)
            .setColor("GREEN")
            .setThumbnail(micon)
            .addField(`${member.user.username} joined`, `${formatDateLong(member.joinedAt)} EST`)
            .addField("New total members", guild.memberCount)
            .setTimestamp();

        if (guild.channels.cache.some(channel => channel.id === settings.joinMessages.channelID)) {
            let logChannel = guild.channels.cache.find(channel => channel.id === settings.joinMessages.channelID);

            if (!logChannel.permissionsFor(client.user).has("SEND_MESSAGES")) {
                // TODO: check in dashboard
                return;
            }
            logChannel.send(embedMsg);
        }
    }

    // Welcome message is enabled
    if (settings.welcomeMessage.enabled) {
        const parsedWelcomeMessage = parseWelcomeMessage(settings.welcomeMessage.welcomeMessage, member, member.guild);

        if (member.guild.channels.cache.some(channel => channel.id === settings.welcomeMessage.channelID)) {
            let welcomeChannel = member.guild.channels.cache.find(channel => channel.id === settings.welcomeMessage.channelID);

            if (!welcomeChannel.permissionsFor(client.user).has("SEND_MESSAGES")) {
                // TODO: check in dashboard
                return;
            }
            welcomeChannel.send(parsedWelcomeMessage);
        }
    }
};

function parseWelcomeMessage(message, member, guild) {
    let parsedMessage = message.replace("{{member}}", member.user.username);
    parsedMessage = parsedMessage.replace("{{server}}", guild.name);

    return parsedMessage;
}