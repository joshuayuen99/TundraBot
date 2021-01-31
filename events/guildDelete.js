const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { formatDate, formatDateLong } = require("../functions");
const { Guild } = require("../models");

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").Guild} guild Discord Guild
*/
module.exports = async (client, guild) => {
    try {
        await Guild.findOneAndDelete({ guildID: guild.id });

        // Delete from cache
        client.databaseCache.settings.delete(guild.id);
    } catch (err) {
        console.error("Leave server error: ", err);
    }

    console.log(`Left guild: ${guild.name}`);

    const owner = await client.users.fetch(process.env.OWNERID);

    const [bots, users] = guild.members.cache.partition(member => member.user.bot);

    const embedMsg = new MessageEmbed()
        .setColor("RED")
        .setTimestamp()
        .setFooter(guild.name, guild.iconURL())
        .setAuthor("Left server :(", guild.iconURL())
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
};