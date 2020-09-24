const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const { Guild, Channel, Message } = require("../../models");
const moment = require("moment");

module.exports = {
    name: "undelete",
    aliases: ["ud"],
    category: "moderation",
    description: "Displays the user's last \`n\` (default 10) deleted messages in the specified channel. The \`all\`, \`id\`, and \`mention\` options can only be used by members with the \`Manage Messages\` permission and will display the last \`n\`deleted messages of the specified member(s) in that channel.",
    usage: `undelete [all | id | mention] [-c channel] [-n number of messages]
    ex. undelete @TundraBot -c #general`,
    run: async (client, message, args, settings) => {
        // Check if the user specified a channel
        let targetChannelName;
        if (args.includes("-c")) {
            if (args[args.indexOf("-c") + 1]) {
                targetChannelName = args[args.indexOf("-c") + 1];
            } else {
                message.channel.send("Please specify a channel after \`-c\`. Defaulting to the current channel.");
            }
        }
        let targetChannel;
        if (targetChannelName) {
            if (message.guild.channels.cache.some(channel => `<#${channel.id}>` === targetChannelName)) {
                targetChannelName = message.guild.channels.cache.find(channel => `<#${channel.id}>` === targetChannelName).name;
            }

            if (message.guild.channels.cache.some(channel => channel.name === targetChannelName)) {
                targetChannel = message.guild.channels.cache.find(channel => channel.name === targetChannelName);
            }
        }

        // If the user specified a channel, search that
        let channelObject;
        if (targetChannel) {
            channelObject = await client.getChannel(targetChannel);
        } else { // Default to searching current channel
            if (targetChannelName) {
                await message.channel.send("I couldn't find that channel! Please make sure you typed it correctly. Defaulting to the current channel.");
            }
            targetChannel = message.channel;
            channelObject = await client.getChannel(message.channel);
        }

        let searchOptions;
        if (args[0]) {
            // Give "all" option
            if (args[0].toLowerCase() === "all") {
                if (message.member.hasPermission("MANAGE_MESSAGES")) {
                    searchOptions = {
                        channelID: channelObject._id,
                        deleted: true
                    };
                } else {
                    await message.channel.send("Only members with the \`Manage Messages\` permission can see deleted messages from other users.");
                }
                // If they give an ID
            } else if (message.guild.members.cache.some(member => member == args[0])) {
                if (message.member.hasPermission("MANAGE_MESSAGES")) {
                    searchOptions = {
                        channelID: channelObject._id,
                        deleted: true,
                        userID: args[0]
                    };
                } else {
                    await message.channel.send("Only members with the \`Manage Messages\` permission can see deleted messages from other users.");
                }
            } else if (message.mentions && message.mentions.users.size > 0) {
                if (message.member.hasPermission("MANAGE_MESSAGES")) {
                    searchOptions = {
                        channelID: channelObject._id,
                        deleted: true,
                        userID: message.mentions.users.first().id
                    }
                } else {
                    await message.channel.send("Only members with the \`Manage Messages\` permission can see deleted messages from other users.");
                }
            } else { // Default to only searching for their deleted messages
                searchOptions = {
                    channelID: channelObject._id,
                    deleted: true,
                    userID: message.author.id
                };
            }
        } else { // Default to only searching for their deleted messages
            searchOptions = {
                channelID: channelObject._id,
                deleted: true,
                userID: message.author.id
            };
        }

        let messageLimit = 10;
        if (args.includes("-n")) {
            if (args[args.indexOf("-n") + 1]) {
                messageLimit = Number(args[args.indexOf("-n") + 1]);
                if (isNaN(messageLimit)) {
                    messageLimit = 10;
                    message.channel.send("I couldn't recognize that as a number. Defaulting to 10 messages.");
                }
            } else {
                message.channel.send("Please specify a number of messages to search for after \`-n\`. Defaulting to 10.");
            }
        }

        await Message.find(searchOptions, null, {
            sort: { updatedAt: 1 },
            limit: messageLimit
        }).exec((err, messages) => {
            if (err) return console.error("undelete find error: ", err);

            const embedMsg = new MessageEmbed();

            let deletedMessagesString = "";
            let deletedMessagesCount = 0;
            messages.forEach(savedMessage => {
                deletedMessagesCount += 1;
                let messageDeleteTime = moment(savedMessage.updatedAt);
                let timeSinceDeletion = messageDeleteTime.fromNow();
                let messageText = savedMessage.text;
                let editText = savedMessage.editedText;
                let messageMember = message.guild.members.cache.find(member => member == savedMessage.userID);

                deletedMessagesString += `**${timeSinceDeletion} (${messageDeleteTime.toString()})**\nAuthor: ${messageMember}\n`;

                if (editText) {
                    deletedMessagesString += `Original message:\n\`${messageText}\`\n\n`;

                    let editCounter = 1;
                    editText.forEach(edit => {
                        deletedMessagesString += `Edit ${editCounter}:\n\`${edit}\`\n`;
                        editCounter += 1;
                    })
                } else {
                    deletedMessagesString += `${messageText}\n\n`;
                }

                deletedMessagesString += "\n";
            });

            let headerString = "";
            if (searchOptions.userID) {
                let searchOptionsMember = message.guild.members.cache.find(member => member == searchOptions.userID);

                if (deletedMessagesCount == 0) {
                    deletedMessagesString += `I couldn't find any deleted messages that I've saved from ${searchOptionsMember} in ${targetChannel}!`;
                }

                headerString = `**Latest deleted messages from ${searchOptionsMember} in ${targetChannel}**\n\n`;
            } else {
                headerString = `**Latest deleted messages in ${targetChannel}**\n\n`;

                if (deletedMessagesCount == 0) {
                    deletedMessagesString += `I couldn't find any deleted messages that I've saved from this channel!`;
                }
            }

            embedMsg.setDescription(headerString + deletedMessagesString);

            if (embedMsg.length > 2000) {
                return message.channel.send("Output exceeded 2000 characters. Exported to the attached file", {
                    files: [{
                        attachment: Buffer.from(embedMsg),
                        name: "output.txt"
                    }]
                });
            } else {
                message.channel.send(embedMsg);
            }
        });
        return;
    }
};