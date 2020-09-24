const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userID: String,
    username: String,
    guilds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Guild"
    }],
    settings: {
        timezone: { type: String, default: null }
    }
});

module.exports = mongoose.model("User", userSchema);