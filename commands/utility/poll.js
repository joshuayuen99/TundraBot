const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { createChannel, formatDateLong, waitPollResponse, waitResponse } = require("../../functions.js");
const ms = require("ms");

module.exports = {
    name: "poll",
    category: "utility",
    description: "Starts a poll for a given duration. Responses are given by responding to the poll with emojis. The creator and anyone who participates in the poll will be notified of the results when it finishes.",
    usage: "poll",
    run: async (client, message, args) => {
        message.channel.send("What's the poll question?");
        let pollQuestion = await waitResponse(client, message, message.author, 30);
        if (!pollQuestion) {
            return message.reply("Cancelling poll.");
        }

        message.channel.send("What should the response emojis be?");
        let responseEmojis = await waitResponse(client, message, message.author, 30);
        if (!responseEmojis) {
            return message.reply("Cancelling poll.");
        }

        message.channel.send("How long should the poll last? eg. 30s, 30m, 2h");
        let duration = await waitResponse(client, message, message.author, 30);
        if (!duration) {
            return message.reply("Cancelling poll.");
        }

        const promptEmbed = new MessageEmbed()
            .setColor("PURPLE")
            .setThumbnail(message.author.displayAvatarURL())
            .setFooter(message.member.displayName, message.author.displayAvatarURL())
            .setTimestamp()
            .setTitle("Poll")
            .setDescription(stripIndents`**${pollQuestion.content}**
            
            **Created by:** ${message.member}
            **Ends at:** ${formatDateLong(message.createdTimestamp + ms(duration.content))}`);

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

                                const results = await waitPollResponse(msg, ms(duration.content) / 1000, responseEmojis.content.split(" "));

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

                    const results = await waitPollResponse(msg, ms(duration.content) / 1000, responseEmojis.content.split(" "));

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