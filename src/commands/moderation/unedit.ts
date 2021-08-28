import { Command, CommandContext } from "../../base/Command";
import { MessageEmbed, Permissions } from "discord.js";
import moment from "moment";
import {
    formatDateLong,
    getTextChannel,
    sendReply,
} from "../../utils/functions";
import { messageInterface, messageModel } from "../../models/Message";
import { FilterQuery } from "mongoose";
import Logger from "../../utils/logger";

export default class Unedit implements Command {
    name = "unedit";
    aliases = ["ue"];
    category = "moderation";
    description =
        "Displays the history of the user's last `n` (default 10) edited messages in the server, or the specified channel. The `all`, `id`, and `mention` options can only be used by members with the `Manage Messages` permission and will display the history of the last `n` edited messages of the specified member(s) in the server/specified channel.";
    usage = "unedit [all | id | mention] [-c channel] [-n number of messages]";
    examples = [
        "unedit",
        "unedit @TundraBot",
        "unedit -c #general",
        "unedit all -c #general",
        "unedit @TundraBot -c #general -n 5",
    ];
    enabled = true;
    slashCommandEnabled = false;
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
            "editedText.0": { $exists: true },
            guildID: ctx.guild.id,
        } as FilterQuery<messageInterface>;
        if (targetChannel) searchOptions.channelID = targetChannel.id;
        if (args[0]) {
            // Give "all" option
            if (args[0].toLowerCase() === "all") {
                if (
                    !ctx.member.permissions.has(
                        Permissions.FLAGS.MANAGE_MESSAGES
                    )
                ) {
                    sendReply(
                        ctx.client,
                        "Only members with the `Manage Messages` permission can see the history of edited messages from other users.",
                        ctx.msg
                    );
                    return;
                }
            } else if (ctx.msg.mentions && ctx.msg.mentions.users.size > 0) {
                // If they mention someone
                if (
                    ctx.member.permissions.has(
                        Permissions.FLAGS.MANAGE_MESSAGES
                    )
                ) {
                    searchOptions.userID = ctx.msg.mentions.users.first().id;
                } else {
                    sendReply(
                        ctx.client,
                        "Only members with the `Manage Messages` permission can see the history of edited messages from other users.",
                        ctx.msg
                    );
                    return;
                }
            } else if (/[0-9]+/.exec(args[0])) {
                // If they give an ID
                if (
                    ctx.member.permissions.has(
                        Permissions.FLAGS.MANAGE_MESSAGES
                    )
                ) {
                    searchOptions.userID = args[0];
                } else {
                    sendReply(
                        ctx.client,
                        "Only members with the `Manage Messages` permission can see the history of edited messages from other users.",
                        ctx.msg
                    );
                    return;
                }
            } else {
                // Default to only searching for their deleted messages
                searchOptions.userID = ctx.author.id;
            }
        } else {
            // Default to only searching for their edited messages
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
                    Logger.log("error", `unedit find error:\n${err}`);
                    return;
                }

                const embedMsg = new MessageEmbed();

                let editedMessagesString = "";
                let editedMessagesCount = 0;
                messages.forEach((savedMessage) => {
                    editedMessagesCount += 1;
                    const messageEditTime = moment(savedMessage.updatedAt);
                    const messageEditTimeDiscordDate = formatDateLong(
                        messageEditTime.toDate()
                    );
                    const timeSinceEdited = messageEditTime.fromNow();
                    let messageText = savedMessage.text;
                    const editText = savedMessage.editedText;
                    const author = `<@${savedMessage.userID}>`;
                    const channel = `<#${savedMessage.channelID}>`;

                    // message with attachments only
                    if (!messageText) {
                        const attachmentCount = savedMessage.attachments.length;
                        messageText = `\`${attachmentCount} attachment(s)\``;
                    }

                    editedMessagesString += `**[${editedMessagesCount}] ${timeSinceEdited} (${messageEditTimeDiscordDate})**\n`;

                    editedMessagesString += `Author: ${author}\n`;

                    if (!searchOptions.channelID)
                        editedMessagesString += `Channel: ${channel}\n`;

                    editedMessagesString += `\n\`Original message:\`\n${messageText}\n`;

                    let editCounter = 1;
                    editText.forEach((edit) => {
                        editedMessagesString += `\`Edit ${editCounter}:\`\n${edit}\n`;
                        editCounter += 1;
                    });

                    editedMessagesString += "\n";
                });

                let headerString = "";
                if (searchOptions.userID) {
                    const searchOptionsMember = `<@${searchOptions.userID}>`;

                    if (editedMessagesCount == 0) {
                        editedMessagesString += `I couldn't find the history of any edited messages from ${searchOptionsMember} in ${
                            searchOptions.channelID
                                ? `${targetChannel}`
                                : "this server"
                        }!`;
                    }

                    headerString = `**Latest edited messages from ${searchOptionsMember} in ${
                        searchOptions.channelID ? targetChannel : "this server"
                    }**\n\n`;
                } else {
                    headerString = `**Latest edited messages in ${
                        searchOptions.channelID ? targetChannel : "all channels"
                    }**\n\n`;

                    if (editedMessagesCount == 0) {
                        editedMessagesString += `I couldn't find the history of any edited messages from ${
                            searchOptions.channelID
                                ? "this channel"
                                : "this server"
                        }!`;
                    }
                }

                embedMsg.setDescription(headerString + editedMessagesString);

                if (headerString.length + editedMessagesString.length > 2048) {
                    // TODO: convert to util function
                    ctx.channel.send({
                        content:
                            "Output exceeded 2048 characters. Exported to the attached file.",
                        files: [
                            {
                                attachment: Buffer.from(
                                    headerString + editedMessagesString
                                ),
                                name: "output.txt",
                            },
                        ],
                    }).catch();
                    return;
                } else {
                    sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
                }
            });
        return;
    }
}
