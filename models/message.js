const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    message: {
        text: { type: String, required: true },
        command: String,
        userID: String,
        username: String,
        guildID: String
    },
},
    {
        timestamps: true
    });

module.exports = mongoose.model("Message", messageSchema);