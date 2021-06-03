const { Member } = require("../models");
const { unmute } = require("../commands/moderation/unmute");

module.exports = {
    /**
     * Starts checking...
     * @param {import("discord.js").Client} client Discord Client instance
     */
    async init(client) {
        Member.find({ "mute.endTime": { $ne: null } }).then(async (members) => {
            const dateNow = Date.now();
            for (const member of members) {
                // Check if guild was deleted
                if (!client.guilds.cache.has(member.guildID)) {
                    console.error(`Guild was deleted? (${member.guildID})`);
                    continue;
                }
                const guild = client.guilds.cache.get(member.guildID);

                const discordMember = guild.members.cache.get(member.userID);
                
                // Mute is ongoing
                if (member.mute.endTime > dateNow) {
                    setTimeout(async () => {
                        let settings;
                        try {
                            settings = await client.getGuild(guild);
                            unmute(client, guild, settings, discordMember, "Mute duration expired", null);
                        } catch (err) {
                            console.error("Error getting settings for guild in checkMutes: ", err);
                        }
                    }, member.mute.endTime - dateNow);
                } else { // Mute is done
                    let settings;
                    try {
                        settings = await client.getGuild(guild);
                        unmute(client, guild, settings, discordMember, "Mute duration expired", null);
                    } catch (err) {
                        console.error("Error getting settings for guild in checkMutes: ", err);
                    }
                }
            }
            console.log(`Loaded ${members.length} mutes`);
        }).catch((err) => {
            console.error("Error loading mutes from database: ", err);
        });
    }
}