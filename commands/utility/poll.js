const { MessageEmbed } = require("discord.js");
const { Poll } = require("../../models");
const { stripIndents } = require("common-tags");
const { waitResponse } = require("../../functions.js");
const ms = require("ms");
const GraphemeSplitter = require("grapheme-splitter");

const splitter = new GraphemeSplitter()

module.exports = {
    name: "poll",
    category: "utility",
    description: "Starts a poll for a given duration. Responses are given by responding to the poll with emojis. The creator and anyone who participates in the poll will be notified of the results when it finishes.",
    usage: "poll",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
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
        if (message.guild.channels.cache.some(channel => channel.name === postChannelName && channel.type == "text")) {
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

        if (isNaN(ms(duration.content))) {
            message.reply("I couldn't recognize that duration. Cancelling poll.");
            return;
        }

        const startTime = message.createdAt.getTime();
        const endTime = message.createdAt.getTime() + ms(duration.content);

        // User entered a negative time
        if (endTime <= startTime) {
            message.reply("The poll can't end in the past!");
            return;
        }

        const promptEmbed = new MessageEmbed()
            .setColor("PURPLE")
            .setFooter("Poll ends")
            .setTimestamp(endTime)
            .setTitle("Poll")
            .addField("Question", pollQuestion.content)
            .addField("Created by", message.member);

        postChannel.send(promptEmbed).then(async msg => {
            const pollCreationMessage = await message.reply(`Poll created! Check the ${postChannel} channel to find it.`);

            async function setReactions() {
                for (const reaction of emojisList) {
                    await msg.react(reaction).catch((err) => {
                        throw new Error(reaction);
                    });
                }
            }
    
            setReactions().then(() => {
                const pollObject = {
                    messageID: msg.id,
                    guildID: msg.guild.id,
                    channelID: msg.channel.id,
                    pollQuestion: pollQuestion.content,
                    emojisList: emojisList,
                    creatorID: message.author.id,
                    startTime: startTime,
                    endTime: endTime
                };
    
                client.createPoll(pollObject);
                setTimeout(() => {
                    module.exports.pollHandleFinish(client, pollObject);
                    Poll.deleteOne(pollObject).catch((err) => {
                        console.error("Couldn't delete poll from database: ", err);
                    });
                }, endTime - startTime);
            }).catch((err) => {
                if (msg.deletable) msg.delete();
                if (pollCreationMessage.deletable) pollCreationMessage.delete();
                message.channel.send(`I had trouble reacting with \`${err.message}\`... removing the poll.`);
            });
        });

        return;
    },
    pollHandleMessageReactionAdd: async (client, reaction, user) => {

    },
    pollHandleMessageReactionRemove: async (client, reaction, user) => {

    },
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {Document} poll poll object
    */
    pollHandleFinish: async (client, poll) => {
        const guild = client.guilds.cache.get(poll.guildID);
        if (!guild) return;
        const channel = guild.channels.cache.get(poll.channelID);
        if (!channel) return;
        const msg = channel.messages.cache.get(poll.messageID);
        if (!msg) return;

        let participants = [];
        let resultsString = "";
        for (const emoji of poll.emojisList) {
            const reactions = msg.reactions.cache.get(emoji);
            if (reactions) {
                await reactions.users.fetch();
                if (reactions.me) { // if the bot has reacted with this emoji
                    resultsString += `${emoji}: ${reactions.count - 1}\n`;
                } else { // if someone removed the bot's own reactions
                    resultsString += `${emoji}: ${reactions.count}\n`;
                }
                for (const [userKey, userValue] of reactions.users.cache) {
                    if (userKey != msg.author.id && !(participants.includes(userKey))) {
                        participants.push(userKey);
                    }
                }
            } else { // there were no reactions left of the specified emoji
                resultsString += `${emoji}: 0\n`;
            }
        }

        await guild.members.fetch(poll.creatorID).catch((err) => {
            console.error("Poll creator left the server: ", err);
        });
        const pollCreatorMember = guild.members.cache.get(poll.creatorID);

        const personalEmbed = new MessageEmbed()
            .setColor("BLUE")
            .setFooter(`From the server: ${guild.name}`, guild.iconURL())
            .setTitle("Poll Results")
            .addField("Question", poll.pollQuestion)
            .addField("Results", resultsString)
            .addField("Created by", pollCreatorMember);

        // Let everyone who responded know the results
        for (const user of participants) {
            if (user == poll.creatorID) continue;
            let respondent = await client.users.fetch(user);
            if (respondent.bot) continue;

            respondent.send("You recently responded to a poll. Here are the results!", personalEmbed);
        }

        // Let the author know the results
        let pollCreator = await client.users.fetch(poll.creatorID);
        if (!pollCreator.bot) {
            pollCreator.send("A poll you recently created has concluded. Here are the results!", personalEmbed);
        }

        const resultsEmbed = new MessageEmbed()
            .setColor("BLUE")
            .setFooter("Poll ended")
            .setTimestamp()
            .setTitle("Poll Results")
            .addField("Question", poll.pollQuestion)
            .addField("Results", resultsString)
            .addField("Created by", pollCreatorMember);

        return msg.edit(resultsEmbed);
    }
};