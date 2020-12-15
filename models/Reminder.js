const mongoose = require("mongoose");

const reminderSchema = mongoose.Schema({
    userID: String,
    reminder: String,
    startTime: Date,
    endTime: Date,
});

module.exports = mongoose.model("Reminder", reminderSchema);