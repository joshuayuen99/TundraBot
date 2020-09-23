const { stripIndents } = require("common-tags");
const { waitResponse } = require("../../functions.js");
const moment = require("moment");

module.exports = {
    name: "settimezone",
    aliases: ["setz"],
    category: "utility",
    description: "Changes a user's timezone. Used for time specific commands such as \`event\`.",
    usage: stripIndents`settimezone [timezone]
    eg. settimezone America/New_York`,
    run: async (client, message, args, settings) => {
        // Get saved user settings
        let userSettings = await client.getUser(message.author);
        if (!userSettings) { // Create new user if we need
            userSettings = await client.createUser(message.author, message.guild);
        }

        if (args[0]) {
            // Check if valid timezone
            if (!moment.tz.zone(args[0])) return message.reply("I couldn't understand that timezone, cancelling command. Please check to make sure you copied your timezone correctly.");

            userSettings = await client.updateUser(message.author, null, args[0]);

            message.channel.send(`Saved! Your new timezone is \`${userSettings.timezone}\`.`);

            return;
        }

        if (userSettings.timezone) {
            message.channel.send(`Your currently saved timezone is \`${userSettings.timezone}\`.`);
        }

        message.channel.send(stripIndents`What timezone are you in?
        (Visit https://en.wikipedia.org/wiki/List_of_tz_database_time_zones and copy and paste your \`TZ database name\`)`);
        let timezoneMessage = await waitResponse(client, message, message.author, 120);
        if (!timezoneMessage) {
            return message.reply("Cancelling settimezone.");
        }

        // Check if valid timezone
        if (!moment.tz.zone(timezoneMessage.content)) return message.reply("I couldn't understand that timezone, cancelling command. Please check to make sure you copied your timezone correctly.");

        userSettings = await client.updateUser(message.author, null, timezoneMessage.content);

        message.channel.send(`Saved! Your new timezone is \`${userSettings.timezone}\`.`);
    }
};