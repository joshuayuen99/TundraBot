import { Command, CommandContext } from "../../base/Command";
import { MessageEmbed } from "discord.js";
import moment from "moment";
import { formatDateLong, getTextChannel, sendReply } from "../../utils/functions";
import { messageInterface, messageModel } from "../../models/Message";
import { FilterQuery } from "mongoose";
import Logger from "../../utils/logger";

export default class Undelete implements Command {
    name = "undelete";
    aliases = ["ud"];
    category = "moderation";
    description =
        "Displays the user's last `n` (default 10) deleted messages in the server, or the specified channel if one was given. The `all`, `id`, and `mention` options can only be used by members with the `Manage Messages` permission and will display the last `n` deleted messages of the specified member(s) in the server/specified channel.";
    usage =
        "undelete [all | id | mention] [-c channel] [-n number of messages]";
    examples = [
        "undelete",
        "undelete @TundraBot",
        "undelete -c #general",
        "undelete all -c #general",
        "undelete @TundraBot -c #general -n 5",
    ];
    enabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        // Check if the user specified a channel
        let targetChannelName;
        if (args.includes("-c")) {
            if (args[args.indexOf("-c") + 1]) {
                targetChannelName = args[args.indexOf("-c") + 1];
            } else {
                sendReply(
                    ctx.client,
                    "Please specify a channel after `-c`. Defaulting to all channels.",
                    ctx.msg
                );
            }
        }
        let targetChannel;
        if (targetChannelName) {
            targetChannel = await getTextChannel(ctx.guild, targetChannelName);
        }

        // If the user specified a channel, search that
        if (!targetChannel) {
            // Default to searching all channels
            if (targetChannelName) {
                sendReply(
                    ctx.client,
                    "I couldn't find that channel! Please make sure you typed it correctly. Defaulting to all channels.",
                    ctx.msg
                );
            }
        }

        const searchOptions = {
            deleted: true,
            guildID: ctx.guild.id,
        } as FilterQuery<messageInterface>;
        if (targetChannel) searchOptions.channelID = targetChannel.id;
        if (args[0]) {
            // Give "all" option
            if (args[0].toLowerCase() === "all") {
                if (!ctx.member.hasPermission("MANAGE_MESSAGES")) {
                    sendReply(
                        ctx.client,
                        "Only members with the `Manage Messages` permission can see deleted messages from other users.",
                        ctx.msg
                    );
                    return;
                }
            } else if (ctx.msg.mentions && ctx.msg.mentions.users.size > 0) {
                if (ctx.member.hasPermission("MANAGE_MESSAGES")) {
                    searchOptions.userID = ctx.msg.mentions.users.first().id;
                } else {
                    sendReply(
                        ctx.client,
                        "Only members with the `Manage Messages` permission can see deleted messages from other users.",
                        ctx.msg
                    );
                    return;
                }
            } else if (/[0-9]+/.exec(args[0])) {
                // If they give an ID
                if (ctx.member.hasPermission("MANAGE_MESSAGES")) {
                    searchOptions.userID = args[0];
                } else {
                    sendReply(
                        ctx.client,
                        "Only members with the `Manage Messages` permission can see deleted messages from other users.",
                        ctx.msg
                    );
                    return;
                }
            } else {
                // Default to only searching for their deleted messages
                searchOptions.userID = ctx.author.id;
            }
        } else {
            // Default to only searching for their deleted messages
            searchOptions.userID = ctx.author.id;
        }

        let messageLimit = 10;
        if (args.includes("-n")) {
            if (args[args.indexOf("-n") + 1]) {
                messageLimit = Number(args[args.indexOf("-n") + 1]);
                if (isNaN(messageLimit)) {
                    messageLimit = 10;
                    sendReply(
                        ctx.client,
                        "I couldn't recognize that as a number. Defaulting to 10 messages.",
                        ctx.msg
                    );
                }
            } else {
                sendReply(
                    ctx.client,
                    "Please specify a number of messages to search for after `-n`. Defaulting to 10.",
                    ctx.msg
                );
            }
        }

        await messageModel
            .find(searchOptions, null, {
                sort: { updatedAt: -1 },
                limit: messageLimit,
            })
            .exec(async (err, messages) => {
                if (err) {
                    Logger.log("error", `undelete find error:\n${err}`);
                    return;
                }

                const embedMsg = new MessageEmbed();

                let deletedMessagesString = "";
                let deletedMessagesCount = 0;
                messages.forEach((savedMessage) => {
                    deletedMessagesCount += 1;
                    const messageDeleteTime = moment(savedMessage.updatedAt);
                    const messageDeleteTimeDiscordDate = formatDateLong(messageDeleteTime.toDate());
                    const timeSinceDeletion = messageDeleteTime.fromNow();
                    let messageText = savedMessage.text;
                    const editText = savedMessage.editedText;
                    const author = `<@${savedMessage.userID}>`;
                    const channel = `<#${savedMessage.channelID}>`;

                    // message with attachments only
                    if (!messageText) {
                        const attachmentCount = savedMessage.attachments.length;
                        messageText = `\`${attachmentCount} attachment(s)\``;
                    }

                    deletedMessagesString += `**[${deletedMessagesCount}] ${timeSinceDeletion} (${messageDeleteTimeDiscordDate})**\n`;
                    
                    deletedMessagesString += `Author: ${author}\n`;

                    if (!searchOptions.channelID)
                        deletedMessagesString += `Channel: ${channel}\n`;

                    deletedMessagesString += `Original message:\n${messageText}\n\n`;

                    let editCounter = 1;
                    editText.forEach((edit) => {
                        deletedMessagesString += `Edit ${editCounter}:\n\`${edit}\`\n`;
                        editCounter += 1;
                    });

                    deletedMessagesString += "\n";
                });

                let headerString = "";
                if (searchOptions.userID) {
                    const searchOptionsMember = `<@${searchOptions.userID}>`;

                    if (deletedMessagesCount == 0) {
                        deletedMessagesString += `I couldn't find any deleted messages that I've saved from ${searchOptionsMember} in ${
                            searchOptions.channelID
                                ? `${targetChannel}`
                                : "this server"
                        }!`;
                    }

                    headerString = `**Latest deleted messages from ${searchOptionsMember} in ${
                        searchOptions.channelID ? targetChannel : "this server"
                    }**\n\n`;
                } else {
                    headerString = `**Latest deleted messages in ${
                        searchOptions.channelID ? targetChannel : "all channels"
                    }**\n\n`;

                    if (deletedMessagesCount == 0) {
                        deletedMessagesString += `I couldn't find any deleted messages that I've saved from ${
                            searchOptions.channelID
                                ? "this channel"
                                : "this server"
                        }!`;
                    }
                }

                embedMsg.setDescription(headerString + deletedMessagesString);

                if (headerString.length + deletedMessagesString.length > 2048) {
                    // TODO: convert to util function
                    ctx.channel.send(
                        "Output exceeded 2048 characters. Exported to the attached file.",
                        {
                            files: [
                                {
                                    attachment: Buffer.from(
                                        headerString + deletedMessagesString
                                    ),
                                    name: "output.txt",
                                },
                            ],
                        }
                    );
                    return;
                } else {
                    sendReply(ctx.client, embedMsg, ctx.msg);
                }
            });
        return;
    }
}
