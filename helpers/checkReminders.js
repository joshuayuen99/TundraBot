const { Reminder } = require("../models");
const { remind } = require("../commands/utility/remind");

module.exports = {
    /**
     * Starts checking...
     * @param {import("discord.js").Client} client Discord Client instance
     */
    async init(client) {
        Reminder.find().then(async (reminders) => {
            const dateNow = Date.now();
            for (const reminder of reminders) {
                // Fetch user if not cached already
                if (!client.users.cache.has(reminder.userID)) await client.users.fetch(reminder.userID);
                
                // Reminder is in the future
                if (reminder.endTime > dateNow) {
                    setTimeout(async () => {
                        remind(client, reminder);
                    }, reminder.endTime - dateNow);
                } else { // Reminder end time has passed
                    remind(client, reminder);
                }
            }
            console.log(`Loaded ${reminders.length} reminders`);
        }).catch((err) => {
            console.error("Error loading reminders from database: ", err);
        });
    }
}