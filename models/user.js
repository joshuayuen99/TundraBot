const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    userID: String,
    username: String,
    settings: {
        timezone: { type: String, default: null }
    }
});

module.exports = mongoose.model("User", userSchema);