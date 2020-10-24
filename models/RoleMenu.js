const mongoose = require("mongoose");

const roleMenuSchema = mongoose.Schema({
    messageID: String,
    guildID: String,
    channelID: String,
    roleMenuTitle: String,
    roleOptions: [{
        emoji: { type: String },
        roleID: { type: String }
    }]
});

module.exports = mongoose.model("RoleMenu", roleMenuSchema);