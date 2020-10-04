const mongoose = require("mongoose");

const eventSchema = mongoose.Schema({
    messageID: String,
    guildID: String,
    channelID: String,
    event: String,
    maxParticipants: { type: Number, default: 0 },
    participants: [{ type: String }],
    creatorID: String,
    startTime: Date,
    endTime: Date,
});

module.exports = mongoose.model("Event", eventSchema);