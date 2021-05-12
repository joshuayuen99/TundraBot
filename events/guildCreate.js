const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { createRole, formatDate, formatDateLong, createChannel } = require("../functions");
const { defaultGuildSettings: defaults } = require("../config");

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").Guild} guild Discord Guild
*/
module.exports = async (client, guild) => {
    try {
        let clientMember = await guild.members.cache.get(client.user.id);
        const newGuild = {
            guildID: guild.id,
            guildName: guild.name,
            timeJoined: clientMember.joinedAt
        };

        await client.createGuild(newGuild);
    } catch (err) {
        console.error("Join server error: ", err);
    }

    console.log(`Joined new guild: ${guild.name}`);

    const owner = await client.users.fetch(process.env.OWNERID);

    const [bots, users] = guild.members.cache.partition(member => member.user.bot);

    const embedMsg = new MessageEmbed()
        .setColor("GREEN")
        .setTimestamp()
        .setFooter(guild.name, guild.iconURL())
        .setAuthor("Joined server :)", guild.iconURL())
        .addField("Guild information", stripIndents`**\\> ID:** ${guild.id}
            **\\> Name:** ${guild.name}
            **\\> Member count:** ${guild.memberCount}
            **\\> User count:** ${users.size}
            **\\> Bot count:** ${bots.size}
            **\\> Created at:** ${formatDateLong(guild.createdTimestamp)}
            **\\> Joined at:** ${formatDateLong(guild.joinedTimestamp)}`);   
    if (!guild.owner) {
        await guild.members.fetch(guild.ownerID);
    }
        embedMsg.addField("Server owner information", stripIndents`**\\> ID:** ${guild.owner.user.id}
            **\\> Username:** ${guild.owner.user.username}
            **\\> Discord Tag:** ${guild.owner.user.tag}
            **\\> Created account:** ${formatDate(guild.owner.user.createdAt)}`, true);

    owner.send(embedMsg);

    // Create default channels
    createChannel(guild, defaults.logChannel, null).then((channel) => {
        client.updateGuild(guild, {
            logMessages: {
                enabled: true,
                channelID: channel.id
            }
        }).catch((err) => {
            console.error("Database error when adding logChannel: ", err);
        });

        const embedGreeting = new MessageEmbed()
            .setTitle("TundraBot Info")
            .setDescription(stripIndents`**Thanks for adding me to your server!**

            I offer lots of configuration via my [web dashboard](${process.env.DASHBOARD_URL}), but the basics can also be changed with commands as described below!
            
            My default prefix is \`${defaults.prefix}\` (not \`-\`)! This is the top-left key on most keyboards. To change this you may run \`${defaults.prefix}config prefix <new prefix>\` (without the <>s).
            
            This channel will serve as the default channel I will use to log whenever moderation commands are used and by who. You may also change this with \`${defaults.prefix}config logChannel <new channel>\`.
            
            Type \`${defaults.prefix}help\` to get started with a list of all commands! \`${defaults.prefix}help <command>\` will display more info on a specific command.
            
            `)
            .addField("Useful links", `[Website/Dashboard](${process.env.DASHBOARD_URL}), [Invite Me](${process.env.BOT_INVITE_LINK}), [Support Server](${process.env.SUPPORT_SERVER_INVITE_LINK})`)
            .setColor("BLUE")
            .setThumbnail(client.user.displayAvatarURL());
        channel.send(embedGreeting);
    }).catch((err) => {
        console.error("Couldn't create log channel: ", err);

        client.updateGuild(guild, {
            logMessages: {
                enabled: false,
                channelID: null
            }
        });
    });

    // Create necessary roles for soundboard commands
    createRole(guild, defaults.soundboardRole, null).then((role) => {
        client.updateGuild(guild, {
            soundboardRoleID: role.id
        }).catch((err) => {
            console.error("Database error when adding soundboardRole: ", err);
        });
    }).catch((err) => {
        console.error("Couldn't create soundboard role: ", err);

        client.updateGuild(guild, {
            soundboardRoleID: guild.roles.cache.find(role => role.name === "@everyone").id
        });
    });
};