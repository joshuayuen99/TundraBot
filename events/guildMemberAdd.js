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
            .setDescription(`${member.user} (${member.user.tag}) joined the server`)
            .setColor("GREEN")
            .setThumbnail(micon)
            .addField(`${member.user.username} joined`, `${formatDateLong(member.joinedAt)} EST`)
            .addField("New total members", guild.memberCount)
            .setTimestamp();

        // Invite tracker enabled
        if (settings.joinMessages.trackInvites) {
            await guild.fetchInvites().then((invites) => {
                const cachedInvites = client.guildInvites.get(guild.id);

                let inviteUsed;
                for (const invite of invites) {
                    if (!cachedInvites.get(invite[0])) continue;
                    if (cachedInvites.get(invite[0]).uses < invite[1].uses) {
                        inviteUsed = invite[1];

                        // Update cached invite uses
                        cachedInvites.set(invite[0], invite[1]);
                        break;
                    }
                }

                if (inviteUsed) embedMsg.addField("Invited by: ", `${inviteUsed.inviter ? `${inviteUsed.inviter} (${inviteUsed.inviter.tag})` : "Unknown"}\nCode: ${inviteUsed.code}\nUses: ${inviteUsed.uses}`);
            }).catch((err) => {
                console.error("Invite tracker fetchInvites error: ", err);
            });
        }

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