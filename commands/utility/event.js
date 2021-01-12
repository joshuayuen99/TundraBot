const { MessageEmbed } = require("discord.js");
const { Event } = require("../../models");
const { stripIndents } = require("common-tags");
const { waitResponse } = require("../../functions.js");
const moment = require("moment");
const momentTimezone = require("moment-timezone");

const HAND_EMOJI = "✋";

module.exports = {
    name: "event",
    category: "utility",
    description: "Starts an interactive wizard to schedule an event to begin at a given time. Anyone who would like to participate in the event can respond to be notified when it begins.",
    usage: "event",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        message.channel.send("What channel should I post the event in? eg. #general (type `here` for the current one)");
        let postChannelMessage = await waitResponse(client, message, message.author, 120);
        if (!postChannelMessage) {
            return message.reply("Cancelling event.");
        }

        let postChannelName;
        if (postChannelMessage.content.toLowerCase() === "here") {
            postChannelName = message.channel.name;
        }
        else if (message.guild.channels.cache.some(channel => `<#${channel.id}>` === postChannelMessage.content)) {
            postChannelName = message.guild.channels.cache.find(channel => `<#${channel.id}>` === postChannelMessage.content).name;
        } else {
            postChannelName = postChannelMessage.content;
        }

        let postChannel;
        // Check to see if the channel exists
        if (message.guild.channels.cache.some(channel => channel.name === postChannelName && channel.type == "text")) {
            postChannel = message.guild.channels.cache.find(channel => channel.name === postChannelName);

            // Check to make sure we have permission to post in the channel
            const botPermissionsIn = message.guild.me.permissionsIn(postChannel);
            if (!botPermissionsIn.has("SEND_MESSAGES")) return message.reply("I don't have permission to post in that channel. Contact your server admin to give me permission overrides.");
        } else { // Channel doesn't exist
            return message.reply("I couldn't find that channel! Cancelling event.");
        }

        message.channel.send(stripIndents`Using channel ${postChannel}
        What's the event?`);
        let event = await waitResponse(client, message, message.author, 120);
        if (!event) {
            return message.reply("Cancelling event.");
        }

        message.channel.send("Enter the max number of people able to join (or 0 for no limit).");
        let maxParticipantsMessage = await waitResponse(client, message, message.author, 120);
        if (!maxParticipantsMessage) {
            return message.reply("Cancelling event.");
        }

        const maxParticipants = parseInt(maxParticipantsMessage.content);
        if (isNaN(maxParticipants)) {
            return message.reply("Cancelling event. Please enter a number.");
        }

        // Get saved user settings
        let userSettings = await client.getUser(message.author);
        if (!userSettings) { // Create new user if we need
            userSettings = await client.createUser(message.author);
        }

        // If we don't have a saved timezone for the user
        if (!userSettings.settings.timezone) {
            message.channel.send(stripIndents`What timezone are you in?
            (Visit https://en.wikipedia.org/wiki/List_of_tz_database_time_zones and copy and paste your \`TZ database name\`)`);
            let timezoneMessage = await waitResponse(client, message, message.author, 120);
            if (!timezoneMessage) {
                return message.reply("Cancelling event.");
            }

            // Check if valid timezone
            if (!moment.tz.zone(timezoneMessage.content)) return message.reply("I couldn't understand that timezone. Cancelling event.");

            await client.updateUser(message.author, { timezone: timezoneMessage.content });
            userSettings = await client.getUser(message.author);
        }

        message.channel.send(stripIndents`Using timezone: \`${userSettings.settings.timezone}\`. To change this use the \`settimezone\` command.`);

        message.channel.send("What date will the event take place? `(mm/dd/yy)`");
        let eventDate = await waitResponse(client, message, message.author, 60);
        if (!eventDate) {
            return message.reply("Cancelling event.");
        }

        message.channel.send("What time will the event take place? `(hh:mm AM/PM)`");
        let timeOfDay = await waitResponse(client, message, message.author, 60);
        if (!timeOfDay) {
            return message.reply("Cancelling event.");
        }

        let momentEventDate = momentTimezone.tz(eventDate.content + " " + timeOfDay.content, "MM/DD/YY hh:mm a", userSettings.settings.timezone);
        if (!momentEventDate.isValid()) return message.reply("I couldn't understand the time and date of the event. Cancelling event.");

        const startTime = message.createdAt.getTime();
        const endTime = momentEventDate;

        let momentNow = moment();

        // If the time is in the past
        if (endTime.isBefore(momentNow)) {
            let curTimeString = momentNow.clone().tz(userSettings.settings.timezone).format("M/D/YYYY h:mm A");
            let attemptTimeString = momentEventDate.clone().tz(userSettings.settings.timezone).format("M/D/YYYY h:mm A");

            return message.reply(`That time already passed! It is currently \`${curTimeString}\` in \`${userSettings.settings.timezone}\` time and you attempted to make an event at \`${attemptTimeString}\`. A common reason for this is typing the year in YYYY format instead of YY. Cancelling event.`);
        }

        const baseEmbed = new MessageEmbed()
            .setColor("PURPLE")
            .setFooter("Event starts")
            .setTimestamp(endTime.toISOString())
            .setTitle("Scheduled Event")
            .addField("Event", event.content)
            .addField("Time", `UTC: \`${endTime.utc().format("DD MMM YYYY HH:mm")}\`\nLook at the bottom of this message to see when the event starts in your local time.`)
            .addField("Scheduled by", stripIndents`${message.member}
            
            React with a ${HAND_EMOJI} emoji to sign up for the event and be alerted when it starts!`);

        const promptEmbed = new MessageEmbed(baseEmbed);

        if (maxParticipants === 0) {
            promptEmbed.addField("Participants (0)", "`None`");
        } else {
            promptEmbed.addField(`Participants (0 / ${maxParticipants})`, "`None`");
        }

        postChannel.send(promptEmbed).then(async msg => {
            message.reply(`Event created! Check the ${postChannel} channel to find it.`);

            const validReactions = [HAND_EMOJI];

            async function setReactions() {
                for (const reaction of validReactions) {
                    msg.react(reaction).catch((err) => {
                        msg.channel.send("I had trouble reacting with the required emojis... removing the event.");
                        if (msg.deletable) msg.delete();
                        console.error("setReactions for event command error: ", err);
                        throw err;
                    });
                }
            }

            await setReactions().then(() => {
                const eventObject = {
                    messageID: msg.id,
                    guildID: msg.guild.id,
                    channelID: msg.channel.id,
                    event: event.content,
                    maxParticipants: maxParticipants,
                    participants: [],
                    creatorID: message.author.id,
                    startTime: startTime,
                    endTime: endTime
                };

                // Save event to database
                client.createEvent(eventObject);
                // Save event to cache
                client.databaseCache.events.set(eventObject.messageID, eventObject);

                setTimeout(() => {
                    module.exports.eventHandleFinish(client, client.databaseCache.events.get(eventObject.messageID));
                }, endTime - startTime);
            }).catch((err) => {
                console.error("Couldn't create an event: ", err);
            });

            // const filter = (reaction, user) => (validReactions.includes(reaction.emoji.name) && user.id != msg.author.id);

            // const collector = msg.createReactionCollector(filter, { time: momentEventDate.diff(moment(), "ms"), dispose: true });

            // let participants = new Set();

            // collector.on("collect", (reaction, user) => {
            //     participants.add(user);

            //     const { participantsString, waitingString } = getParticipantsString(participants, maxParticipants);

            //     const newEmbed = new MessageEmbed(baseEmbed);

            //     if (maxParticipants === 0) {
            //         newEmbed.addField(`Participants (${participants.size})`, participantsString);
            //     } else {
            //         newEmbed.addField(`Participants (${participants.size > maxParticipants ? maxParticipants : participants.size} / ${maxParticipants})`, participantsString);
            //     }

            //     // If there are more people signed up than allowed, show them in a waiting list
            //     if (maxParticipants !== 0 && participants.size > maxParticipants) {
            //         newEmbed.addField(`Waiting List (${participants.size - maxParticipants})`, waitingString);
            //     }

            //     return msg.edit(newEmbed);
            // });

            // collector.on("remove", (reaction, user) => {
            //     participants.delete(user);

            //     const { participantsString, waitingString } = getParticipantsString(participants, maxParticipants);

            //     const newEmbed = new MessageEmbed(baseEmbed);

            //     if (maxParticipants === 0) {
            //         newEmbed.addField(`Participants (${participants.size})`, participantsString);
            //     } else {
            //         newEmbed.addField(`Participants (${participants.size > maxParticipants ? maxParticipants : participants.size} / ${maxParticipants})`, participantsString);
            //     }

            //     // If there are more people signed up than allowed, show them in a waiting list
            //     if (maxParticipants !== 0 && participants.size > maxParticipants) {
            //         newEmbed.addField(`Waiting List (${participants.size - maxParticipants})`, waitingString);
            //     }

            //     return msg.edit(newEmbed);
            // });

            // collector.on("end", (collected) => {
            //     const { participantsString, waitingString } = getParticipantsString(participants, maxParticipants);

            //     const finalEmbed = new MessageEmbed()
            //         .setColor("GREEN")
            //         .setFooter("Event started")
            //         .setTimestamp(momentEventDate.toISOString())
            //         .setTitle("Event Started")
            //         .addField("Event", event.content)
            //         .addField("Scheduled by", message.member);

            //     // Print differently depending on if there was a cap set or not for participants
            //     if (maxParticipants === 0) { // No limit
            //         finalEmbed.addField(`Participants (${participants.size})`, participantsString);
            //     } else { // Limit
            //         finalEmbed.addField(`Participants (${participants.size > maxParticipants ? maxParticipants : participants.size} / ${maxParticipants})`, participantsString);
            //     }

            //     msg.edit(finalEmbed);

            //     const personalEmbed = new MessageEmbed()
            //         .setColor("BLUE")
            //         .setFooter(`From the server: ${message.guild.name}`, message.guild.iconURL())
            //         .setTitle("Event starting now!")
            //         .setDescription(stripIndents`The event you signed up for: **${event.content}** is starting now!`);

            //     // Let everyone who responded know the event is starting
            //     async function alertParticipants() {
            //         if (maxParticipants !== 0 && participants.size > maxParticipants) { // Only let those who signed up before the limit was hit know
            //             const iterator = participants[Symbol.iterator]();
            //             for (let i = 0; i < maxParticipants; i++) {
            //                 let respondent = await client.users.fetch(iterator.next().value.id);
            //                 if (respondent.bot) continue;

            //                 respondent.send(personalEmbed);
            //             }
            //         } else { // Let everyone know
            //             for (user of participants) {
            //                 let respondent = await client.users.fetch(user.id);
            //                 if (respondent.bot) continue;

            //                 respondent.send(personalEmbed);
            //             }
            //         }
            //     }

            //     alertParticipants();
            // });
        });

        return;
    },
    eventHandleMessageReactionAdd: async (client, reaction, user) => {
        // it was our own reaction
        if (user.id == client.user.id) return;
        // not an event message
        if (!client.databaseCache.events.has(reaction.message.id)) return;

        if (reaction.emoji.name != HAND_EMOJI) return;

        let cachedEvent = client.databaseCache.events.get(reaction.message.id);

        // we already have them saved for some reason?
        if (cachedEvent.participants.includes(user.id)) return;

        const guild = client.guilds.cache.get(cachedEvent.guildID);
        const channel = guild.channels.cache.get(cachedEvent.channelID);
        const msg = channel.messages.cache.get(cachedEvent.messageID);

        // add user to participants array
        cachedEvent.participants.push(user.id);
        // update database
        client.updateEvent(reaction.message.id, { participant: user.id, add: true });

        const { participantsString, waitingString } = module.exports.getParticipantsString(cachedEvent.participants, cachedEvent.maxParticipants);

        const eventCreatorMember = guild.members.cache.get(cachedEvent.creatorID);

        const newEmbed = new MessageEmbed()
            .setColor("PURPLE")
            .setFooter("Event starts")
            .setTimestamp(cachedEvent.endTime)
            .setTitle("Scheduled Event")
            .addField("Event", cachedEvent.event)
            .addField("Time", `UTC: \`${moment(cachedEvent.endTime).utc().format("DD MMM YYYY HH:mm")}\`\nLook at the bottom of this message to see when the event starts in your local time.`)
            .addField("Scheduled by", stripIndents`${eventCreatorMember}
            
            React with a ${HAND_EMOJI} emoji to sign up for the event and be alerted when it starts!`);

        if (cachedEvent.maxParticipants === 0) {
            newEmbed.addField(`Participants (${cachedEvent.participants.length})`, participantsString);
        } else {
            newEmbed.addField(`Participants (${cachedEvent.participants.length > cachedEvent.maxParticipants ? cachedEvent.maxParticipants : cachedEvent.participants.length} / ${cachedEvent.maxParticipants})`, participantsString);
        }

        // If there are more people signed up than allowed, show them in a waiting list
        if (cachedEvent.maxParticipants !== 0 && cachedEvent.participants.length > cachedEvent.maxParticipants) {
            newEmbed.addField(`Waiting List (${cachedEvent.participants.length - cachedEvent.maxParticipants})`, waitingString);
        }

        return msg.edit(newEmbed);
    },
    eventHandleMessageReactionRemove: async (client, reaction, user) => {
        // it was our own reaction
        if (user.id == client.user.id) return;
        // not an event message
        if (!client.databaseCache.events.has(reaction.message.id)) return;

        if (reaction.emoji.name != HAND_EMOJI) return;

        let cachedEvent = client.databaseCache.events.get(reaction.message.id);

        // we don't have them saved for some reason?
        if (!cachedEvent.participants.includes(user.id)) return;

        const guild = client.guilds.cache.get(cachedEvent.guildID);
        const channel = guild.channels.cache.get(cachedEvent.channelID);
        const msg = channel.messages.cache.get(cachedEvent.messageID);

        // remove user from participants array
        const index = cachedEvent.participants.indexOf(user.id);
        if (index > -1) {
            cachedEvent.participants.splice(index, 1);
        }
        // update database
        client.updateEvent(reaction.message.id, { participant: user.id, add: false });

        const { participantsString, waitingString } = module.exports.getParticipantsString(cachedEvent.participants, cachedEvent.maxParticipants);

        const eventCreatorMember = guild.members.cache.get(cachedEvent.creatorID);

        const newEmbed = new MessageEmbed()
            .setColor("PURPLE")
            .setFooter("Event starts")
            .setTimestamp(cachedEvent.endTime)
            .setTitle("Scheduled Event")
            .addField("Event", cachedEvent.event)
            .addField("Time", `UTC: \`${moment(cachedEvent.endTime).utc().format("DD MMM YYYY HH:mm")}\`\nLook at the bottom of this message to see when the event starts in your local time.`)
            .addField("Scheduled by", stripIndents`${eventCreatorMember}
            
            React with a ${HAND_EMOJI} emoji to sign up for the event and be alerted when it starts!`);

        if (cachedEvent.maxParticipants === 0) {
            newEmbed.addField(`Participants (${cachedEvent.participants.length})`, participantsString);
        } else {
            newEmbed.addField(`Participants (${cachedEvent.participants.length > cachedEvent.maxParticipants ? cachedEvent.maxParticipants : cachedEvent.participants.length} / ${cachedEvent.maxParticipants})`, participantsString);
        }

        // If there are more people signed up than allowed, show them in a waiting list
        if (cachedEvent.maxParticipants !== 0 && cachedEvent.participants.length > cachedEvent.maxParticipants) {
            newEmbed.addField(`Waiting List (${cachedEvent.participants.length - cachedEvent.maxParticipants})`, waitingString);
        }

        return msg.edit(newEmbed);
    },
    eventHandleFinish: async (client, event) => {
        const guild = client.guilds.cache.get(event.guildID);
        if (!guild) return;
        const channel = guild.channels.cache.get(event.channelID);
        if (!channel) return;
        const msg = channel.messages.cache.get(event.messageID);
        if (!msg) return;

        const { participantsString, waitingString } = module.exports.getParticipantsString(event.participants, event.maxParticipants);

        const eventCreatorMember = guild.members.cache.get(event.creatorID);

        const finalEmbed = new MessageEmbed()
            .setColor("GREEN")
            .setFooter("Event started")
            .setTimestamp(event.endTime)
            .setTitle("Event Started")
            .addField("Event", event.event)
            .addField("Time", `UTC: \`${moment(event.endTime).utc().format("DD MMM YYYY HH:mm")}\`\nLook at the bottom of this message to see when the event started in your local time.`)
            .addField("Scheduled by", eventCreatorMember);

        // Print differently depending on if there was a cap set or not for participants
        if (event.maxParticipants === 0) { // No limit
            finalEmbed.addField(`Participants (${event.participants.length})`, participantsString);
        } else { // Limit
            finalEmbed.addField(`Participants (${event.participants.length > event.maxParticipants ? event.maxParticipants : event.participants.length} / ${event.maxParticipants})`, participantsString);
        }

        msg.edit(finalEmbed);

        const personalEmbed = new MessageEmbed()
            .setColor("BLUE")
            .setFooter(`From the server: ${msg.guild.name}`, msg.guild.iconURL())
            .setTitle("Event starting now!")
            .setDescription(stripIndents`The event you signed up for: **${event.event}** is starting now!`);

        // Let everyone who responded know the event is starting
        async function alertParticipants() {
            if (event.maxParticipants !== 0 && event.participants.length > event.maxParticipants) { // Only let those who signed up before the limit was hit know
                const iterator = event.participants[Symbol.iterator]();
                for (let i = 0; i < event.maxParticipants; i++) {
                    let respondent = await client.users.fetch(iterator.next().value);
                    if (respondent.bot) continue;

                    respondent.send(personalEmbed);
                }
            } else { // Let everyone know
                for (const userID of event.participants) {
                    let respondent = await client.users.fetch(userID);
                    if (respondent.bot) continue;

                    respondent.send(personalEmbed);
                }
            }
        }

        alertParticipants();

        // remove event from database and cache
        Event.deleteOne({ messageID: event.messageID }).catch((err) => {
            console.error("Couldn't delete event from database: ", err);
        });
        client.databaseCache.events.delete(event.messageID);
    },
    getParticipantsString: (participants, maxParticipants) => {
        let participantsString = "";
        let waitingString = "";

        // Max number of participants to show when there is no limit, or max number of people to show in waiting list when there is a limit
        const maxShownParticipants = 10;

        if (participants.length === 0) {
            participantsString = "`None`";
        } else if (maxParticipants === 0) { // No participants limit
            if (participants.length <= maxShownParticipants) { // maxShownParticipants or less
                for (let participant of participants) {
                    participantsString += `<@${participant}>\n`;
                }
            } else { // More than maxShownParticipants
                const iterator = participants[Symbol.iterator]();
                for (let i = 0; i < maxShownParticipants; i++) {
                    participantsString += `<@${iterator.next().value}>\n`;
                }
                participantsString += "...";
            }
        } else { // There's a participants limit
            if (participants.length <= maxParticipants) { // maxParticipants or less
                for (let participant of participants) {
                    participantsString += `<@${participant}>\n`;
                }
            } else { // More than maxParticipants
                const iterator = participants[Symbol.iterator]();
                for (let i = 0; i < maxParticipants; i++) {
                    participantsString += `<@${iterator.next().value}>\n`;
                }
                for (let i = 0; i < participants.length - maxParticipants; i++) {
                    if (i === maxShownParticipants) {
                        waitingString += "...";
                        break;
                    }

                    waitingString += `<@${iterator.next().value}>\n`;
                }
            }
        }

        return { participantsString, waitingString };
    }
};