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
    welcomeMessage: {
        enabled: { type: Boolean, default: false },
        welcomeMessage: { type: String, default: defaults.welcomeMessage.welcomeMessage },
        channelID: { type: String, default: null },
    },
    joinMessages: {
        enabled: { type: Boolean, default: false },
        channelID: { type: String, default: null },
        trackInvites: { type: Boolean, default: true }
    },
    leaveMessages: {
        enabled: { type: Boolean, default: false },
        channelID: { type: String, default: null }
    },
    soundboardRoleID: {
        type: String,
        default: null
    },
    modRole: {
        type: String,
        default: defaults.modRole
    },
    adminRole: {
        type: String,
        default: defaults.adminRole
    },
    logMessages: {
        enabled: { type: Boolean, default: false },
        channelID: { type: String, default: null },
    },
    blacklistedChannelIDs: [{ type: String }]
});

module.exports = mongoose.model("Guild", guildSchema);