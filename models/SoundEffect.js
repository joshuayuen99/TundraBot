const mongoose = require("mongoose");

const soundEffectSchema = mongoose.Schema({
    name: String,
    link: String,
    guildID: String
});

module.exports = mongoose.model("SoundEffect", soundEffectSchema);