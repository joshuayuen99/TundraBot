const mongoose = require("mongoose");

const memberSchema = mongoose.Schema({
    userID: String,
    guildID: String,
    username: String,
    settings: {
        joinSoundEffect: { type: mongoose.Schema.Types.ObjectId, ref: "SoundEffect", default: null },
        leaveSoundEffect: { type: mongoose.Schema.Types.ObjectId, ref: "SoundEffect", default: null },
    }
});

module.exports = mongoose.model("Member", memberSchema);