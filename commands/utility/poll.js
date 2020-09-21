const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { createChannel, formatDateLong, waitPollResponse, waitResponse } = require("../../functions.js");
const ms = require("ms");
const GraphemeSplitter = require("grapheme-splitter");

const splitter = new GraphemeSplitter()

module.exports = {
    name: "poll",
    category: "utility",
    description: "Starts a poll for a given duration. Responses are given by responding to the poll with emojis. The creator and anyone who participates in the poll will be notified of the results when it finishes.",
    usage: "poll",
    run: async (client, message, args) => {
        message.channel.send("What channel should I post the poll in? (type `here` for the current one)");
        let postChannelMessage = await waitResponse(client, message, message.author, 120);
        if (!postChannelMessage) {
            return message.reply("Cancelling poll.");
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
        What's the poll question?`);
        let pollQuestion = await waitResponse(client, message, message.author, 120);
        if (!pollQuestion) {
            return message.reply("Cancelling poll.");
        }

        message.channel.send("What should the response emojis be?");
        let responseEmojis = await waitResponse(client, message, message.author, 120);
        if (!responseEmojis) {
            return message.reply("Cancelling poll.");
        }
        let emojisList = splitter.splitGraphemes(responseEmojis.content.replace(/\s/g, ""));

        message.channel.send("How long should the poll last? eg. 30s, 30m, 2h");
        let duration = await waitResponse(client, message, message.author, 120);
        if (!duration) {
            return message.reply("Cancelling poll.");
        }

        const promptEmbed = new MessageEmbed()
            .setColor("PURPLE")
            .setFooter("Poll ends")
            .setTimestamp(message.createdAt.getTime() + ms(duration.content))
            .setTitle("Poll")
            .addField("Question", pollQuestion.content)
            .addField("Created by", message.member);

        postChannel.send(promptEmbed).then(async msg => {
            const pollCreationMessage = await message.reply(`Poll created! Check the ${postChannel} channel to find it.`);

            const results = await waitPollResponse(msg, ms(duration.content) / 1000, emojisList).catch((err) => {
                console.error("Poll error: ", err);
                return message.reply("I had trouble reacting with those emojis...");
            });

            if (results.size == 0) return;

            let participants = [];
            let resultsString = "";
            for (const [key, value] of results.entries()) {
                resultsString += `${key}: ${value.count - 1}\n`;

                for (const [userKey, userValue] of value.users.cache) {
                    if (userKey != message.author.id && !(userKey in participants)) {
                        participants.push(userKey);
                    }
                }
            }

            const personalEmbed = new MessageEmbed()
                .setColor("BLUE")
                .setFooter(`From the server: ${message.guild.name}`, message.guild.iconURL())
                .setTitle("Poll Results")
                .addField("Question", pollQuestion.content)
                .addField("Results", resultsString)
                .addField("Created by", message.member);

            // Let everyone who responded know the results
            for (user of participants) {
                let respondent = await client.users.fetch(user);
                if (respondent.bot) continue;

                respondent.send("You recently responded to a poll. Here are the results!");
                respondent.send(personalEmbed);
            }

            // Let the author know the results
            let pollCreator = await client.users.fetch(message.author.id);
            if (!pollCreator.bot) {
                pollCreator.send("A poll you recently created has concluded. Here are the results!");
                pollCreator.send(personalEmbed);
            }

            const resultsEmbed = new MessageEmbed()
                .setColor("BLUE")
                .setFooter("Poll ended")
                .setTimestamp()
                .setTitle("Poll Results")
                .addField("Question", pollQuestion.content)
                .addField("Results", resultsString)
                .addField("Created by", message.member);

            return msg.edit(resultsEmbed);
        });

        return;

        // Log activity and create channel if necessary
        if (!message.guild.channels.cache.some(channel => channel.name === "polls")) {
            if (!message.guild.me.hasPermission("MANAGE_CHANNELS")) {
                message.channel.send("I couldn't post the poll to the correct channel and I don't have permissions to create it.");
            } else {
                await createChannel(message.guild, "polls", [{
                    id: message.guild.id
                }])
                    .then(() => {
                        const pollChannel = message.guild.channels.cache.find(channel => channel.name === "polls");

                        try {
                            pollChannel.send(promptEmbed).then(async msg => {
                                message.reply(`Poll created! Check the ${pollChannel} channel to find it.`);

                                const results = await waitPollResponse(msg, ms(duration.content) / 1000, emojisList);

                                let participants = [];
                                let resultsString = "";
                                for (const [key, value] of results.entries()) {
                                    resultsString += `${key}: ${value.count - 1}\n`;

                                    for (const [userKey, userValue] of value.users.cache) {
                                        if (userKey != message.author.id && !(userKey in participants)) {
                                            participants.push(userKey);
                                        }
                                    }
                                }

                                const personalEmbed = new MessageEmbed()
                                    .setColor("BLUE")
                                    .setThumbnail(message.author.displayAvatarURL())
                                    .setFooter(message.guild.name, message.guild.iconURL())
                                    .setTimestamp()
                                    .setTitle("Poll Results")
                                    .setDescription(stripIndents`**${pollQuestion.content}**
                                    
                                    **Results:**
                                    ${resultsString}
                                    **Created by:** ${message.member}
                                    **Poll started at:** ${formatDateLong(message.createdTimestamp)}`)

                                // Let everyone who responded know the results
                                for (user of participants) {
                                    let respondent = await client.users.fetch(user);
                                    if (respondent.bot) continue;

                                    respondent.send("You recently responded to a poll. Here are the results!");
                                    respondent.send(personalEmbed);
                                }

                                // Let the author know the results
                                let pollCreator = await client.users.fetch(message.author.id);
                                if (!pollCreator.bot) {
                                    pollCreator.send("A poll you recently created has concluded. Here are the results!");
                                    pollCreator.send(personalEmbed);
                                }

                                const resultsEmbed = new MessageEmbed()
                                    .setColor("BLUE")
                                    .setThumbnail(message.author.displayAvatarURL())
                                    .setFooter(message.member.displayName, message.author.displayAvatarURL())
                                    .setTimestamp()
                                    .setTitle("Poll Results")
                                    .setDescription(stripIndents`**${pollQuestion.content}**
                                    
                                    **Results:**
                                    ${resultsString}
                                    **Created by:** ${message.member}
                                    **Poll started at:** ${formatDateLong(message.createdTimestamp)}`)

                                return pollChannel.send(resultsEmbed);
                            });
                        } catch {
                            return message.channel.send("There was an error with creating the poll. Please check your response emojis to make sure there are no other characters other than each emoji option separated by spaces.");
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
        } else { // Channel already exists
            const pollChannel = message.guild.channels.cache.find(channel => channel.name === "polls");

            try {
                pollChannel.send(promptEmbed).then(async msg => {
                    message.reply(`Poll created! Check the ${pollChannel} channel to find it.`);

                    const results = await waitPollResponse(msg, ms(duration.content) / 1000, emojisList);

                    let participants = [];
                    let resultsString = "";
                    for (const [key, value] of results.entries()) {
                        resultsString += `${key}: ${value.count - 1}\n`;

                        for (const [userKey, userValue] of value.users.cache) {
                            if (userKey != message.author.id && !(userKey in participants)) {
                                participants.push(userKey);
                            }
                        }
                    }

                    const personalEmbed = new MessageEmbed()
                        .setColor("BLUE")
                        .setThumbnail(message.author.displayAvatarURL())
                        .setFooter(message.guild.name, message.guild.iconURL())
                        .setTimestamp()
                        .setTitle("Poll Results")
                        .setDescription(stripIndents`**${pollQuestion.content}**
                        
                        **Results:**
                        ${resultsString}
                        **Created by:** ${message.member}
                        **Poll started at:** ${formatDateLong(message.createdTimestamp)}`)

                    // Let everyone who responded know the results
                    for (user of participants) {
                        let respondent = await client.users.fetch(user);
                        if (respondent.bot) continue;

                        respondent.send("A poll you recently participated in has concluded. Here are the results!");
                        respondent.send(personalEmbed);
                    }

                    // Let the author know the results
                    let pollCreator = await client.users.fetch(message.author.id);
                    if (!pollCreator.bot) {
                        pollCreator.send("A poll you recently created has concluded. Here are the results!");
                        pollCreator.send(personalEmbed);
                    }

                    const resultsEmbed = new MessageEmbed()
                        .setColor("BLUE")
                        .setThumbnail(message.author.displayAvatarURL())
                        .setFooter(message.member.displayName, message.author.displayAvatarURL())
                        .setTimestamp()
                        .setTitle("Poll Results")
                        .setDescription(stripIndents`**${pollQuestion.content}**
                        
                        **Results:**
                        ${resultsString}
                        **Created by:** ${message.member}
                        **Poll started at:** ${formatDateLong(message.createdTimestamp)}`)

                    return pollChannel.send(resultsEmbed);
                });
            } catch {
                return message.channel.send("There was an error with creating the poll. Please check your response emojis to make sure there are no other characters other than each emoji option separated by spaces.");
            }
        }

        return;
    }
};