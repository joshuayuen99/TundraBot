import { Command, CommandContext } from "../../base/Command";

import {
    Message,
    MessageEmbed,
    PermissionString,
    TextChannel,
} from "discord.js";
import { stripIndents } from "common-tags";
import {
    formatDateLong,
    getTextChannel,
    sendMessage,
    sendReply,
    waitResponse,
} from "../../utils/functions";
import ms from "ms";
import GraphemeSplitter from "grapheme-splitter";
import { DBPoll, pollInterface } from "../../models/Poll";
import Deps from "../../utils/deps";
import Logger from "../../utils/logger";
import { TundraBot } from "../../base/TundraBot";

const splitter = new GraphemeSplitter();

export default class Poll implements Command {
    name = "poll";
    category = "utility";
    description =
        "Starts a poll for a given duration. Responses are given by responding to the poll with emojis. The creator and anyone who participates in the poll will be notified of the results when it finishes.";
    usage = "poll";
    enabled = true;
    guildOnly = true;
    botPermissions: PermissionString[] = ["ADD_REACTIONS"];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 10000; // 10 seconds

    DBPollManager: DBPoll;
    constructor() {
        this.DBPollManager = Deps.get<DBPoll>(DBPoll);
    }

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        if (
            !(await sendMessage(
                ctx.client,
                "What channel should I post the poll in? eg. #general (type `here` for the current one)",
                ctx.channel
            ))
        )
            return;

        const postChannelMessage = await waitResponse(ctx.client, ctx.channel, ctx.author, 120);
        if (!postChannelMessage) {
            sendReply(ctx.client, "Cancelling poll.", ctx.msg);
            return;
        }

        let postChannel: TextChannel | void;
        if (postChannelMessage.content.toLowerCase() === "here") {
            postChannel = ctx.channel;
        } else {
            postChannel = await getTextChannel(
                ctx.guild,
                postChannelMessage.content
            );
        }

        // Channel doesn't exist
        if (!postChannel) {
            sendReply(
                ctx.client,
                "I couldn't find that channel! Cancelling poll.",
                postChannelMessage
            );
            return;
        }

        // Check to make sure we have permission to post in the channel
        const botPermissionsIn = ctx.guild.me.permissionsIn(postChannel);
        if (!botPermissionsIn.has("SEND_MESSAGES")) {
            sendReply(
                ctx.client,
                "I don't have permission to post in that channel. Contact your server admin to give me permission overrides.",
                postChannelMessage
            );
            return;
        }

        sendMessage(
            ctx.client,
            stripIndents`Using channel ${postChannel}
            What's the poll question?`,
            ctx.channel
        );

        const pollQuestionMessage = await waitResponse(
            ctx.client,
            ctx.channel,
            ctx.author,
            120
        );
        if (!pollQuestionMessage) {
            sendReply(ctx.client, "Cancelling poll.", postChannelMessage);
            return;
        }

        sendMessage(
            ctx.client,
            "What should the response emojis be?",
            ctx.channel
        );
        const responseEmojisMessage = await waitResponse(
            ctx.client,
            ctx.channel,
            ctx.author,
            120
        );
        if (!responseEmojisMessage) {
            sendReply(ctx.client, "Cancelling poll.", postChannelMessage);
            return;
        }
        const emojisList: string[] = [];
        const emojisListIterator = responseEmojisMessage.content.match(/<:[A-z0-9]+:[0-9]+>/g);
        const standardEmojisList = responseEmojisMessage.content.replace(/<:[A-z0-9]+:[0-9]+>/g, "");
        if (emojisListIterator) {
            for (const customEmoji of emojisListIterator) {
                emojisList.push(customEmoji);
            }
        }

        splitter.splitGraphemes(standardEmojisList.replace(/\s/g, "")).forEach((standardEmoji) => {
            emojisList.push(standardEmoji);
        });

        sendMessage(
            ctx.client,
            "How long should the poll last? eg. 30s, 30m, 2h",
            ctx.channel
        );

        const durationMessage = await waitResponse(
            ctx.client,
            ctx.channel,
            ctx.author,
            120
        );
        if (!durationMessage) {
            sendReply(ctx.client, "Cancelling poll.", postChannelMessage);
            return;
        }

        let pollDuration = 0;
        const timeUnits = durationMessage.content.match(/([0-9]+(\.[0-9])*)+ *[A-z]+/gm);
        for (const timeUnit of timeUnits) {
            const unitDuration = ms(timeUnit);
            if (isNaN(unitDuration)) {
                sendReply(ctx.client, "I couldn't recognize that duration. Cancelling poll.", postChannelMessage);
                return;
            } else {
                pollDuration += unitDuration;
            }
        }

        const startTime = ctx.msg.createdAt;
        const endTime = new Date(startTime.getTime() + pollDuration);

        // User entered a negative time
        if (endTime <= startTime) {
            sendReply(ctx.client, "The poll can't end in the past!", ctx.msg);
            return;
        }

        const promptEmbed = new MessageEmbed()
            .setColor("PURPLE")
            .setFooter("Poll ends")
            .setTimestamp(endTime)
            .setTitle("Poll")
            .addField("Question", pollQuestionMessage.content)
            .addField("Created by", ctx.member)
            .addField("Poll ends", formatDateLong(endTime));

        const pollMessage = (await sendMessage(ctx.client, promptEmbed, postChannel)) as Message;

        const pollCreationMessage = (await sendMessage(ctx.client, `Poll created! Check the ${postChannel} channel to find it.`, ctx.channel)) as Message;

        try {
            for (const reaction of emojisList) {
                await pollMessage.react(reaction).catch((err) => {
                    Logger.log("error", `poll reacting error (${reaction}):\n${err}`);
                    
                    if (pollMessage.deletable) pollMessage.delete();
                    if (pollCreationMessage.deletable) pollCreationMessage.delete();
                    sendMessage(ctx.client, `I had trouble reacting with \`${reaction}\`... removing the poll.`, ctx.channel);
                });
            }

            const pollObject = {
                messageID: pollMessage.id,
                guildID: pollMessage.guild.id,
                channelID: pollMessage.channel.id,
                pollQuestion: pollQuestionMessage.content,
                emojisList: emojisList,
                creatorID: ctx.author.id,
                startTime: startTime,
                endTime: endTime
            } as pollInterface;

            this.DBPollManager.create(pollObject).then(() => {
                setTimeout(() => {
                    this.pollHandleFinish(ctx.client, pollObject);
                    // Poll.deleteOne(pollObject).catch((err) => {
                    //     console.error("Couldn't delete poll from database: ", err);
                    // });
                }, endTime.valueOf() - startTime.valueOf());
            }).catch((err) => {
                Logger.log("error", `Error saving poll to database:\n${err}`);
            });
        } catch (err) {
            // Trouble reacting with emojis
        }

        return;
    }

    async pollHandleFinish(client: TundraBot, poll: pollInterface): Promise<void> {
        const guild = client.guilds.cache.get(poll.guildID);
        if (!guild || !guild.available) return;
        const channel = guild.channels.cache.get(poll.channelID) as TextChannel;
        if (!channel) return;
        const msg = channel.messages.cache.get(poll.messageID);
        if (!msg) return;

        const participants = [];
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

        const pollCreatorMember = `<@${poll.creatorID}>`;

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
            const respondent = await client.users.fetch(user);
            if (respondent.bot) continue;

            respondent.send("You recently responded to a poll. Here are the results!", personalEmbed).catch(() => {
                // user can't receive DM's from the bot
            });
        }

        // Let the author know the results
        client.users.fetch(poll.creatorID).then((pollCreator) => {
            if (!pollCreator.bot) {
                pollCreator.send("A poll you recently created has concluded. Here are the results!", personalEmbed);
            }
        }).catch(() => {
            // poll creator left the server
        });
        
        const resultsEmbed = new MessageEmbed()
            .setColor("BLUE")
            .setFooter("Poll ended")
            .setTimestamp()
            .setTitle("Poll Results")
            .addField("Question", poll.pollQuestion)
            .addField("Results", resultsString)
            .addField("Created by", pollCreatorMember)
            .addField("Poll ended", formatDateLong(poll.endTime));

        msg.edit(resultsEmbed);

        this.DBPollManager.delete(poll);
        return;
    }
}