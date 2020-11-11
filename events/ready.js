const checkPolls = require(".././helpers/checkPolls");
const checkEvents = require("../helpers/checkEvents");
const loadRoleMenus = require("../helpers/loadRoleMenus");
const loadMemberSoundEffects = require("../helpers/loadMemberSoundEffects");
const cacheMembers = require("../helpers/cacheMembers");

/**
 * @param {import("discord.js").Client} client Discord Client instance
*/
module.exports = (client) => {
    client.user.setPresence({
        status: "online",
        activity: {
            name: "music ~play | ~help",
            type: "PLAYING",
        }
    });

    checkPolls.init(client);
    checkEvents.init(client);
    loadRoleMenus.init(client);
    loadMemberSoundEffects.init(client);
    cacheMembers.init(client);

    console.log(`I'm now online, my name is ${client.user.tag}`);
};