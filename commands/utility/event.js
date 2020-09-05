const { MessageEmbed, Message } = require("discord.js");
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
        message.channel.send("What channel should I post the event in? (type `here` for the current one)");
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
        if (message.guild.channels.cache.some(channel => channel.name === postChannelName)) {
            postChannel = message.guild.channels.cache.find(channel => channel.name === postChannelName);

            // Check to make sure we have permission to post in the channel
            const botPermissionsIn = message.guild.me.permissionsIn(postChannel);
            if (!botPermissionsIn.has("SEND_MESSAGES")) return message.reply("I don't have permission to post in that channel. Contact your server admin to give me permission overrides.");
        } else { // Channel doesn't exist
            return message.reply("I couldn't find that channel! Please check to make sure you typed it correctly.");
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
            return message.reply("Please enter a number.");
        }

        message.channel.send(stripIndents`What timezone are you in?
        (Visit https://en.wikipedia.org/wiki/List_of_tz_database_time_zones and copy and paste your \`TZ database name\`)`);
        let timezone = await waitResponse(client, message, message.author, 120);
        if (!timezone) {
            return message.reply("Cancelling event.");
        }

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

        let momentEventDate = momentTimezone.tz(eventDate.content + " " + timeOfDay.content, "MM/DD/YY hh:mm a", timezone.content);
        if (!momentEventDate.isValid()) return message.reply("I couldn't understand the time and date of the event. Please enter it as shown when prompted.");

        const promptEmbed = new MessageEmbed()
            .setColor("PURPLE")
            .setFooter("Event starts")
            .setTimestamp(momentEventDate.toISOString())
            .setTitle("Scheduled Event")
            .addField("Event", event.content)
            .addField("Scheduled by", stripIndents`${message.member}
            
            React with a ${HAND_EMOJI} emoji to sign up for the event and be alerted when it starts!`);

        postChannel.send(promptEmbed).then(async msg => {
            message.reply(`Event created! Check the ${postChannel} channel to find it.`);

            const validReactions = [HAND_EMOJI];

            async function setReactions() {
                for (const reaction of validReactions) msg.react(reaction);
            }

            await setReactions();

            const filter = (reaction, user) => (validReactions.includes(reaction.emoji.name) && user.id != msg.author.id);

            const collector = msg.createReactionCollector(filter, { time: momentEventDate.diff(moment(), "ms"), dispose: true });

            let participants = new Set();

            function getParticipantsString(participants, maxParticipants) {
                let participantsString = "";
                let waitingString = "";

                // Max number of participants to show when there is no limit, or max number of people to show in waiting list when there is a limit
                const maxShownParticipants = 10;

                if (participants.size === 0) {
                    participantsString = "`None`";
                } else if (maxParticipants === 0) { // No participants limit
                    if (participants.size <= maxShownParticipants) { // maxShownParticipants or less
                        for (let participant of participants) {
                            participantsString += `${participant}\n`;
                        }
                    } else { // More than maxShownParticipants
                        const iterator = participants[Symbol.iterator]();
                        for (let i = 0; i < maxShownParticipants; i++) {
                            participantsString += `${iterator.next().value}\n`;
                        }
                        participantsString += "...";
                    }
                } else { // There's a participants limit
                    if (participants.size <= maxParticipants) { // maxParticipants or less
                        for (let participant of participants) {
                            participantsString += `${participant}\n`;
                        }
                    } else { // More than maxParticipants
                        const iterator = participants[Symbol.iterator]();
                        for (let i = 0; i < maxParticipants; i++) {
                            participantsString += `${iterator.next().value}\n`;
                        }
                        for (let i = 0; i < participants.size - maxParticipants; i++) {
                            if (i === maxShownParticipants) {
                                waitingString += "...";
                                break;
                            }

                            waitingString += `${iterator.next().value}\n`;
                        }
                    }
                }

                return { participantsString, waitingString };
            }

            collector.on("collect", (reaction, user) => {
                participants.add(user);

                const { participantsString, waitingString } = getParticipantsString(participants, maxParticipants);

                const newEmbed = new MessageEmbed(promptEmbed);

                if (maxParticipants === 0) {
                    newEmbed.addField(`Participants (${participants.size})`, participantsString);
                } else {
                    newEmbed.addField(`Participants (${participants.size > maxParticipants ? maxParticipants : participants.size} / ${maxParticipants})`, participantsString);
                }

                // If there are more people signed up than allowed, show them in a waiting list
                if (maxParticipants !== 0 && participants.size > maxParticipants) {
                    newEmbed.addField(`Waiting List (${participants.size - maxParticipants})`, waitingString);
                }

                return msg.edit(newEmbed);
            });

            collector.on("remove", (reaction, user) => {
                participants.delete(user);

                const { participantsString, waitingString } = getParticipantsString(participants, maxParticipants);

                const newEmbed = new MessageEmbed(promptEmbed);

                if (maxParticipants === 0) {
                    newEmbed.addField(`Participants (${participants.size})`, participantsString);
                } else {
                    newEmbed.addField(`Participants (${participants.size > maxParticipants ? maxParticipants : participants.size} / ${maxParticipants})`, participantsString);
                }

                // If there are more people signed up than allowed, show them in a waiting list
                if (maxParticipants !== 0 && participants.size > maxParticipants) {
                    newEmbed.addField(`Waiting List (${participants.size - maxParticipants})`, waitingString);
                }

                return msg.edit(newEmbed);
            });

            collector.on("end", (collected) => {
                const { participantsString, waitingString } = getParticipantsString(participants, maxParticipants);

                const finalEmbed = new MessageEmbed()
                    .setColor("GREEN")
                    .setFooter("Event started")
                    .setTimestamp(momentEventDate.toISOString())
                    .setTitle("Event Started")
                    .addField("Event", event.content)
                    .addField("Scheduled by", message.member);

                // Print differently depending on if there was a cap set or not for participants
                if (maxParticipants === 0) { // No limit
                    finalEmbed.addField(`Participants (${participants.size})`, participantsString);
                } else { // Limit
                    finalEmbed.addField(`Participants (${participants.size > maxParticipants ? maxParticipants : participants.size} / ${maxParticipants})`, participantsString);
                }

            msg.edit(finalEmbed);

            const personalEmbed = new MessageEmbed()
                .setColor("BLUE")
                .setFooter(`From the server: ${message.guild.name}`, message.guild.iconURL())
                .setTitle("Event starting now!")
                .setDescription(stripIndents`The event you signed up for: **${event.content}** is starting now!`);

            // Let everyone who responded know the event is starting
            async function alertParticipants() {
                if (maxParticipants !== 0 && participants.size > maxParticipants) { // Only let those who signed up before the limit was hit know
                    const iterator = participants[Symbol.iterator]();
                    for (let i = 0; i < maxParticipants; i++) {
                        let respondent = await client.users.fetch(iterator.next().value.id);
                        if (respondent.bot) continue;

                        respondent.send(personalEmbed);
                    }
                } else { // Let everyone know
                    for (user of participants) {
                        let respondent = await client.users.fetch(user.id);
                        if (respondent.bot) continue;
    
                        respondent.send(personalEmbed);
                    }
                }
            }

            alertParticipants();
        });
    });

    return;

    // Log activity and create channel if necessary
    if(!message.guild.channels.cache.some(channel => channel.name === "events")) {
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


                        const validReactions = [HAND_EMOJI];

                        async function setReactions() {
                            for (const reaction of validReactions) msg.react(reaction);
                        }

                        await setReactions();

                        const filter = (reaction, user) => validReactions.includes(reaction.emoji.name);

                        const collector = message.createReactionCollector(filter, { time: momentEventDate.diff(moment(), "ms") });

                        let participants = [];

                        collector.on("collect", (reaction, user) => {
                            participants.push(user);

                            return msg.edit(`Participants: ${participants[0].tag}`);
                        });

                        collector.on("end", (collected) => {
                            const newEmbed = new MessageEmbed()
                        });




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