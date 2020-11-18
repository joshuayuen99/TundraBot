const mongoose = require("mongoose");

const memberSchema = mongoose.Schema({
    userID: String,
    guildID: String,
    username: String,
    settings: {
        joinSoundEffect: { type: mongoose.Schema.Types.ObjectId, ref: "SoundEffect", default: null },
        leaveSoundEffect: { type: mongoose.Schema.Types.ObjectId, ref: "SoundEffect", default: null },
    },
    ban: {
        endTime: { type: Date, default: null }
    },
    mute: {
        endTime: { type: Date, default: null }
    }
});

/**
 * @param {Object} condition { userID, guildID } to ban
 * @param {Date} endTime when the ban ends
 */
memberSchema.statics.ban = function ban(condition, endTime) {
    return this.findOneAndUpdate(condition, { "ban.endTime": endTime }, { upsert: true });
}

/**
 * @param {Object} condition { userID, guildID } to unban
 */
memberSchema.statics.unban = function unban(condition) {
    return this.findOneAndUpdate(condition, { "ban.endTime": null });
}

/**
 * @param {Object} condition { userID, guildID } to mute
 * @param {Date} endTime when the mute ends
 */
memberSchema.statics.mute = function mute(condition, endTime) {
    return this.findOneAndUpdate(condition, { "mute.endTime": endTime }, { upsert: true });
}

/**
 * @param {Object} condition { userID, guildID } to unmute
 */
memberSchema.statics.unmute = function unmute(condition) {
    return this.findOneAndUpdate(condition, { "mute.endTime": null });
}

module.exports = mongoose.model("Member", memberSchema);