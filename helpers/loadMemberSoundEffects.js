const { Member, SoundEffect } = require("../models");

module.exports = {
    /**
     * Starts checking...
     * @param {import("discord.js").Client} client Discord Client instance
     */
    async init(client) {
        Member.find({
            $or: [
                {
                    "settings.joinSoundEffect": { $exists: true, $ne: null }
                },
                {
                    "settings.leaveSoundEffect": { $exists: true, $ne: null }
                }]
        }).then(async (members) => {
            for (const member of members) {
                let joinSoundEffect = await SoundEffect.findById(member.settings.joinSoundEffect).catch((err) => {
                    console.error("Error loading sound effect from loadMemberSoundEffect.js", err);
                });

                let leaveSoundEffect = await SoundEffect.findById(member.settings.leaveSoundEffect).catch((err) => {
                    console.error("Error loading sound effect from loadMemberSoundEffect.js", err);
                });

                const soundEffects = {
                    joinSoundEffect: joinSoundEffect,
                    leaveSoundEffect: leaveSoundEffect
                };

                // load into cache
                client.databaseCache.memberSoundEffects.set(`${member.guildID}${member.userID}`, soundEffects);
            }
            console.log(`Loaded ${members.length} members' soundEffects`);
        })
    }
};