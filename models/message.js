const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    text: { type: String, required: true },
    editedText: [{ type: String }],
    command: String,
    userID: String,
    username: String,
    guildID: { type: mongoose.Schema.Types.ObjectId, ref: "Guild" },
    channelID: { type: mongoose.Schema.Types.ObjectId, ref: "Channel" },
    messageID: String,
    deleted: { type: Boolean, default: false }
},
    {
        timestamps: true
    });

module.exports = mongoose.model("Message", messageSchema);