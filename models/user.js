const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userID: String,
    guilds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Guild"
    }],
    timezone: String,
});

module.exports = mongoose.model("User", userSchema);