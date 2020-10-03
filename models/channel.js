const mongoose = require("mongoose");

const channelSchema = mongoose.Schema({
    channelID: String,
    channelName: String,
    guildID: String
});

module.exports = mongoose.model("Channel", channelSchema);