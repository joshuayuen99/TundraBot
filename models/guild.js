const mongoose = require("mongoose");
const { defaultGuildSettings: defaults } = require("../config");

const guildSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    guildID: String,
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
    channels: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Channel"
    }]
});

module.exports = mongoose.model("Guild", guildSchema);