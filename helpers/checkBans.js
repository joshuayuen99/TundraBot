const { Member } = require("../models");
const { unban } = require("../commands/moderation/ban");

module.exports = {
    /**
     * Starts checking...
     * @param {import("discord.js").Client} client Discord Client instance
     */
    async init(client) {
        Member.find({ "ban.endTime": { $ne: null } }).then(async (members) => {
            const dateNow = Date.now();
            for (const member of members) {
                // Check if guild was deleted
                if (!client.guilds.cache.has(member.guildID)) {
                    console.error(`Guild was deleted? (${member.guildID})`);
                    continue;
                }
                const guild = client.guilds.cache.get(member.guildID);
                
                // Ban is ongoing
                if (member.ban.endTime > dateNow) {
                    setTimeout(async () => {
                        let settings;
                        try {
                            settings = await client.getGuild(guild);
                            unban(client, guild, settings, member.userID, "Ban duration expired", null);
                        } catch (err) {
                            console.error("Error getting settings for guild in checkBans: ", err);
                        }
                    }, member.ban.endTime - dateNow);
                } else { // Ban is done
                    let settings;
                    try {
                        settings = await client.getGuild(guild);
                        unban(client, guild, settings, member.userID, "Ban duration expired", null);
                    } catch (err) {
                        console.error("Error getting settings for guild in checkBans: ", err);
                    }
                }
            }
            console.log(`Loaded ${members.length} bans`);
        }).catch((err) => {
            console.error("Error loading bans from database: ", err);
        });
    }
}