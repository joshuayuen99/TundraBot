const { queueEffect } = require("../commands/music/soundboard");

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").VoiceState} oldState old voice state
 * @param {import("discord.js").VoiceState} newState new state
*/
module.exports = (client, oldState, newState) => {
    if (oldState.member.user.bot || newState.member.user.bot) return;

    if (oldState.channel && !newState.channel) { // Left channel
        if (client.databaseCache.memberSoundEffects.has(`${oldState.guild.id}${oldState.member.id}`)) {
            let memberSoundEffects = client.databaseCache.memberSoundEffects.get(`${oldState.guild.id}${oldState.member.id}`);

            if (memberSoundEffects.leaveSoundEffect) {
                queueEffect(client, oldState.guild.id, oldState.channel, memberSoundEffects.leaveSoundEffect);
            }
        }
    } else if (!oldState.channel && newState.channel) { // Joined channel
        if (client.databaseCache.memberSoundEffects.has(`${newState.guild.id}${newState.member.id}`)) {
            let memberSoundEffects = client.databaseCache.memberSoundEffects.get(`${newState.guild.id}${newState.member.id}`);

            if (memberSoundEffects.joinSoundEffect) {
                queueEffect(client, newState.guild.id, newState.channel, memberSoundEffects.joinSoundEffect);
            }
        }
    }
}