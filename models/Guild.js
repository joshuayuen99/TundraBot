const mongoose = require("mongoose");
const { defaultGuildSettings: defaults } = require("../config");

const guildSchema = mongoose.Schema({
    guildID: {
        type: String,
        unique: true
    },
    guildName: String,
    timeJoined: Date,
    prefix: {
        type: String,
        default: defaults.prefix
    },
    welcomeChannel: {
        type: String,
        default: defaults.welcomeChannel
    },
    welcomeMessage: {
        type: String,
        default: defaults.welcomeMessage
    },
    soundboardRole: {
        type: String,
        default: defaults.soundboardRole
    },
    modRole: {
        type: String,
        default: defaults.modRole
    },
    adminRole: {
        type: String,
        default: defaults.adminRole
    },
    logChannel: {
        type: String,
        default: defaults.logChannel
    },
    blacklistedChannelIDs: [{ type: String }]
});

module.exports = mongoose.model("Guild", guildSchema);