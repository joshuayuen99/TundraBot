const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    text: { type: String, required: true },
    command: String,
    userID: String,
    username: String,
    guildID: { type: mongoose.Schema.Types.ObjectId, ref: "Guild"}
},
    {
        timestamps: true
    });

module.exports = mongoose.model("Message", messageSchema);