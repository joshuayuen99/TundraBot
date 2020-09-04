const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { createChannel, formatDateLong, waitPollResponse, waitResponse } = require("../../functions.js");
const moment = require("moment");
const momentTimezone = require("moment-timezone");

const HAND_EMOJI = "✋";

module.exports = {
    name: "event",
    category: "utility",
    description: "Schedules an event to begin at a given time. Anyone who would like to participate in the event can respond to be notified when it begins.",
    usage: "event",
    run: async (client, message, args) => {
        message.channel.send("What's the event?");
        let event = await waitResponse(client, message, message.author, 30);
        if (!event) {
            return message.reply("Cancelling event.");
        }

        message.channel.send("What date will the event take place? (mm/dd/yy)");
        let eventDate = await waitResponse(client, message, message.author, 30);
        if (!eventDate) {
            return message.reply("Cancelling event.");
        }

        message.channel.send(stripIndents`What timezone are you in?
        (Visit https://en.wikipedia.org/wiki/List_of_tz_database_time_zones and copy and paste your **TZ database name**)`);
        let timezone = await waitResponse(client, message, message.author, 120);
        if (!timezone) {
            return message.reply("Cancelling event.");
        }

        message.channel.send("What time will the event take place? (hh:mm AM/PM)");
        let timeOfDay = await waitResponse(client, message, message.author, 30);
        if (!timeOfDay) {
            return message.reply("Cancelling event.");
        }

        let momentEventDate = momentTimezone.tz(eventDate.content + " " + timeOfDay.content, "MM/DD/YY hh:mm a", timezone.content);
        if (!momentEventDate.isValid()) return message.reply("I couldn't understand the time and date of the event. Please enter it as shown when prompted.");

        const promptEmbed = new MessageEmbed()
            .setColor("PURPLE")
            .setFooter("Starts at:")
            .setTimestamp(momentEventDate.toISOString())
            .setTitle("Scheduled Event")
            .setDescription(stripIndents`**${event.content}**
                        
            **Scheduled by:** ${message.member}
            
            React with a ${HAND_EMOJI} emoji to be alerted when the event starts!
            `);

        // Log activity and create channel if necessary
        if (!message.guild.channels.cache.some(channel => channel.name === "events")) {
            if (!message.guild.me.hasPermission("MANAGE_CHANNELS")) {
                message.channel.send("I couldn't post the event to the correct channel and I don't have permissions to create it.");
            } else {
                await createChannel(message.guild, "events", [{
                    id: message.guild.id
                }])
                    .then(() => {
                        const eventChannel = message.guild.channels.cache.find(channel => channel.name === "events");

                        try {
                            eventChannel.send(promptEmbed).then(async msg => {
                                message.reply(`Event created! Check the ${eventChannel} channel to find it.`);

                                const results = await waitPollResponse(msg, momentEventDate.diff(moment(), "s"), HAND_EMOJI);

                                let participants = [];
                                for (const [key, value] of results.entries()) {
                                    for (const [userKey, userValue] of value.users.cache) {
                                        if (!(userKey in participants)) {
                                            participants.push(userKey);
                                        }
                                    }
                                }

                                const personalEmbed = new MessageEmbed()
                                    .setColor("BLUE")
                                    .setFooter(`From the server: ${message.guild.name}`, message.guild.iconURL())
                                    .setTitle("Event starting now!")
                                    .setDescription(stripIndents`The event you signed up for: **${event.content}** is starting now!`);

                                // Let everyone who responded know the event is starting
                                for (user of participants) {
                                    let respondent = await client.users.fetch(user);
                                    if (respondent.bot) continue;

                                    respondent.send(personalEmbed);
                                }

                                return;
                            });
                        } catch {
                            return message.channel.send("There was an error with creating the event.");
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
        } else { // Channel already exists
            const eventChannel = message.guild.channels.cache.find(channel => channel.name === "events");

            try {
                eventChannel.send(promptEmbed).then(async msg => {
                    message.reply(`Event created! Check the ${eventChannel} channel to find it.`);

                    const results = await waitPollResponse(msg, momentEventDate.diff(moment(), "s"), HAND_EMOJI);

                    let participants = [];
                    for (const [key, value] of results.entries()) {
                        for (const [userKey, userValue] of value.users.cache) {
                            if (!(userKey in participants)) {
                                participants.push(userKey);
                            }
                        }
                    }

                    const personalEmbed = new MessageEmbed()
                        .setColor("BLUE")
                        .setFooter(`From the server: ${message.guild.name}`, message.guild.iconURL())
                        .setTitle("Event starting now!")
                        .setDescription(stripIndents`The event you signed up for: **${event.content}** is starting now!`);

                    // Let everyone who responded know the event is starting
                    for (user of participants) {
                        let respondent = await client.users.fetch(user);
                        if (respondent.bot) continue;

                        respondent.send(personalEmbed);
                    }

                    return;
                });
            } catch {
                return message.channel.send("There was an error with creating the event.");
            }
        }

        return;
    }
};