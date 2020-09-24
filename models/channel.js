const mongoose = require("mongoose");
const { Message } = require("./message");

const channelSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    channelID: String,
    channelName: String,
    guildID: { type: mongoose.Schema.Types.ObjectId, ref: "Guild" },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    }]
});

module.exports = mongoose.model("Channel", channelSchema);