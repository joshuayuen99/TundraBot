/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").Invite} invite Discord guild Invite
*/
module.exports = async (client, invite) => {
    let currentInvites = client.guildInvites.get(invite.guild.id);
    if (!currentInvites) return; // we didn't cache any invites for this guild
    currentInvites.delete(invite[0]);
    client.guildInvites.set(invite.guild.id, currentInvites);
}