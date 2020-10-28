const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
    messageID: {
        type: String,
        unique: true
    },
    text: { type: String, required: true },
    editedText: [{ type: String }],
    command: String,
    userID: String,
    username: String,
    guildID: String,
    channelID: String,
    deleted: { type: Boolean, default: false }
},
    {
        timestamps: true
    });

module.exports = mongoose.model("Message", messageSchema);