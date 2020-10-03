const mongoose = require("mongoose");

const pollSchema = mongoose.Schema({
    messageID: String,
    guildID: String,
    channelID: String,
    pollQuestion: String,
    emojisList: [{ type: String }],
    creatorID: String,
    startTime: Date,
    endTime: Date,
});

module.exports = mongoose.model("Poll", pollSchema);