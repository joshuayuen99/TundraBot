const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { formatDate, formatDateLong } = require("../functions");

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

    const embedMsg = new MessageEmbed()
        .setColor("GREEN")
        .setTimestamp()
        .setFooter(guild.name, guild.iconURL())
        .setAuthor("Joined server :)", guild.iconURL())
        .addField("Guild information", stripIndents`**\\> ID:** ${guild.id}
				**\\> Name:** ${guild.name}
				**\\> Member count:** ${guild.memberCount}
				**\\> Created at:** ${formatDateLong(guild.createdTimestamp)}
				**\\> Joined at:** ${formatDateLong(guild.joinedTimestamp)}`)
        .addField("Server owner information", stripIndents`**\\> ID:** ${guild.owner.user.id}
				**\\> Username:** ${guild.owner.user.username}
				**\\> Discord Tag:** ${guild.owner.user.tag}
				**\\> Created account:** ${formatDate(guild.owner.user.createdAt)}`, true);

    owner.send(embedMsg);
};