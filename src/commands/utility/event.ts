import { Command, CommandContext } from "../../base/Command";

import {
    Message,
    MessageEmbed,
    MessageReaction,
    PermissionResolvable,
    Permissions,
    TextChannel,
    User,
} from "discord.js";
import { DBEvent, eventInterface } from "../../models/Event";
import { stripIndents } from "common-tags";
import {
    formatDateLong,
    getTextChannel,
    sendMessage,
    sendReply,
    waitResponse,
} from "../../utils/functions";
import moment from "moment";
import momentTimezone from "moment-timezone";
import { DBUser, userInterface } from "../../models/User";
import Deps from "../../utils/deps";
import { TundraBot } from "../../base/TundraBot";
import Logger from "../../utils/logger";

const HAND_EMOJI = "✋";

// TODO: switch from using emojis to sign up to buttons
// maybe add multiple buttons for signing up with/without notifications
// maybe add optional early notification

export default class Event implements Command {
    name = "event";
    category = "utility";
    description =
        "Starts an interactive wizard to schedule an event to begin at a given time. Anyone who would like to participate in the event can respond to be notified when it begins.";
    usage = "event";
    enabled = true;
    guildOnly = true;
    botPermissions: PermissionResolvable[] = [Permissions.FLAGS.ADD_REACTIONS];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 10000; // 10 seconds

    DBEventManager: DBEvent;
    DBUserManager: DBUser;
    constructor() {
        this.DBEventManager = Deps.get<DBEvent>(DBEvent);
        this.DBUserManager = Deps.get<DBUser>(DBUser);
    }

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        if (
            !(await sendMessage(
                ctx.client,
                "What channel should I post the event in? eg. #general (type `here` for the current one)",
                ctx.channel
            ))
        )
            return;

        const postChannelMessage = await waitResponse(
            ctx.client,
            ctx.channel,
            ctx.author,
            120
        );
        if (!postChannelMessage) {
            sendReply(ctx.client, "Cancelling event.", ctx.msg);
            return;
        }

        let postChannel: TextChannel | void;
        if (postChannelMessage.content.toLowerCase() === "here")
            postChannel = ctx.channel;
        else
            postChannel = await getTextChannel(
                ctx.guild,
                postChannelMessage.content
            );

        // Channel doesn't exist
        if (!postChannel) {
            sendReply(
                ctx.client,
                "I couldn't find that channel! Cancelling event.",
                postChannelMessage
            );
            return;
        }

        // Check to make sure we have permission to post in the channel
        const botPermissionsIn = ctx.guild.me.permissionsIn(postChannel);
        if (!botPermissionsIn.has(Permissions.FLAGS.SEND_MESSAGES)) {
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
            What's the event?`,
            ctx.channel
        );

        const eventTitleMessage = await waitResponse(
            ctx.client,
            ctx.channel,
            ctx.author,
            120
        );
        if (!eventTitleMessage) {
            sendReply(ctx.client, "Cancelling event.", postChannelMessage);
            return;
        }

        sendMessage(
            ctx.client,
            "Enter the max number of people able to join (or 0 for no limit).",
            ctx.channel
        );

        const maxParticipantsMessage = await waitResponse(
            ctx.client,
            ctx.channel,
            ctx.author,
            120
        );
        if (!maxParticipantsMessage) {
            sendReply(ctx.client, "Cancelling event.", eventTitleMessage);
            return;
        }

        const maxParticipants = parseInt(maxParticipantsMessage.content);
        if (isNaN(maxParticipants)) {
            sendReply(
                ctx.client,
                "Cancelling event. Please enter a number.",
                maxParticipantsMessage
            );
            return;
        }

        // Get saved user settings
        let userSettings: userInterface | void = await this.DBUserManager.get(
            ctx.author
        );

        // If we don't have a saved timezone for the user
        if (!userSettings.settings.timezone) {
            sendMessage(
                ctx.client,
                stripIndents`What timezone are you in?
            (Visit https://en.wikipedia.org/wiki/List_of_tz_database_time_zones and copy and paste your \`TZ database name\`)`,
                ctx.channel
            );

            const timezoneMessage = await waitResponse(
                ctx.client,
                ctx.channel,
                ctx.author,
                120
            );
            if (!timezoneMessage) {
                sendReply(
                    ctx.client,
                    "Cancelling event",
                    maxParticipantsMessage
                );
                return;
            }

            // Check if valid timezone
            if (!moment.tz.zone(timezoneMessage.content)) {
                sendReply(
                    ctx.client,
                    "I couldn't understand that timezone. Cancelling event.",
                    timezoneMessage
                );
                return;
            }

            userSettings = await this.DBUserManager.update(ctx.author, {
                timezone: timezoneMessage.content,
            }).catch((err) => {
                Logger.log("error", `Error updating user (userID: ${ctx.author.id}) in database:\n${err}`);
            });

            if (!userSettings) {
                sendReply(
                    ctx.client,
                    `I had trouble updating your settings. Please try again later or contact my developer ${process.env.OWNERNAME}${process.env.OWNERTAG}`,
                    timezoneMessage
                );

                return;
            }
        }

        sendMessage(
            ctx.client,
            stripIndents`Using timezone: \`${userSettings.settings.timezone}\`. To change this use the \`settimezone\` command.`,
            ctx.channel
        );

        sendMessage(
            ctx.client,
            "What date will the event take place? `(mm/dd/yy)`",
            ctx.channel
        );

        const eventDateMessage = await waitResponse(
            ctx.client,
            ctx.channel,
            ctx.author,
            120
        );
        if (!eventDateMessage) {
            sendReply(ctx.client, "Cancelling event", maxParticipantsMessage);
            return;
        }

        sendMessage(
            ctx.client,
            "What time will the event take place? `(hh:mm AM/PM)`",
            ctx.channel
        );
        const timeOfDayMessage = await waitResponse(
            ctx.client,
            ctx.channel,
            ctx.author,
            120
        );
        if (!timeOfDayMessage) {
            sendReply(ctx.client, "Cancelling event", maxParticipantsMessage);
            return;
        }

        const momentEventDate = momentTimezone.tz(
            eventDateMessage.content + " " + timeOfDayMessage.content,
            "MM/DD/YY hh:mm a",
            userSettings.settings.timezone
        );
        if (!momentEventDate.isValid()) {
            sendReply(
                ctx.client,
                "I couldn't understand the time and date of the event. Cancelling event.",
                maxParticipantsMessage
            );
            return;
        }

        const startTime = ctx.msg.createdAt;
        const endTime = momentEventDate;

        const momentNow = moment();

        // If the time is in the past
        if (endTime.isBefore(momentNow)) {
            const curTimeString = momentNow
                .clone()
                .tz(userSettings.settings.timezone)
                .format("M/D/YYYY h:mm A");
            const attemptTimeString = momentEventDate
                .clone()
                .tz(userSettings.settings.timezone)
                .format("M/D/YYYY h:mm A");

            sendReply(
                ctx.client,
                `That time already passed! It is currently \`${curTimeString}\` in \`${userSettings.settings.timezone}\` time and you attempted to make an event at \`${attemptTimeString}\`. A common reason for this is typing the year in YYYY format instead of YY. Cancelling event.`,
                maxParticipantsMessage
            );
            return;
        }

        const baseEmbed = new MessageEmbed()
            .setColor("PURPLE")
            .setFooter("Event starts")
            .setTimestamp(endTime.toDate())
            .setTitle("Scheduled Event")
            .addField("Event", eventTitleMessage.content)
            .addField("Time", formatDateLong(endTime.toDate()))
            .addField(
                "Scheduled by",
                stripIndents`${ctx.member}
            
            React with a ${HAND_EMOJI} emoji to sign up for the event and be alerted when it starts!`
            );

        const promptEmbed = new MessageEmbed(baseEmbed);

        if (maxParticipants === 0) {
            promptEmbed.addField("Participants (0)", "`None`");
        } else {
            promptEmbed.addField(
                `Participants (0 / ${maxParticipants})`,
                "`None`"
            );
        }

        const eventMessage = (await sendMessage(
            ctx.client,
            { embeds: [promptEmbed] },
            postChannel
        )) as Message;

        await eventMessage.react(HAND_EMOJI);

        const eventObject = {
            messageID: eventMessage.id,
            guildID: eventMessage.guild.id,
            channelID: eventMessage.channel.id,
            event: eventTitleMessage.content,
            maxParticipants: maxParticipants,
            participants: [],
            creatorID: ctx.author.id,
            startTime: startTime,
            endTime: endTime.toDate(),
        } as eventInterface;

        // Save event to database
        this.DBEventManager.create(eventObject)
            .then(() => {
                sendReply(
                    ctx.client,
                    `Event created! Check the ${postChannel} channel to find it.`,
                    ctx.msg
                );

                setTimeout(() => {
                    Event.eventHandleFinish(
                        ctx.client,
                        ctx.client.databaseCache.events.get(
                            eventObject.messageID
                        )
                    );
                }, endTime.toDate().valueOf() - startTime.valueOf());
            })
            .catch((err) => {
                Logger.log(
                    "error",
                    `Error saving new event in (guildID: ${ctx.guild.id}) in database:\n${err}`
                );

                // remove event from database and cache
                this.DBEventManager.delete(eventObject);
                if (eventMessage.deletable) eventMessage.delete();
                sendReply(
                    ctx.client,
                    `Failed to create event. Please join my support server with \`${ctx.guildSettings.prefix}invite\` and report this to my developer.`,
                    timeOfDayMessage
                );
            });

        return;
    }

    static async eventHandleMessageReactionAdd(
        client: TundraBot,
        reaction: MessageReaction,
        user: User
    ): Promise<void> {
        const DBEventManager = Deps.get<DBEvent>(DBEvent);

        if (!reaction.message.guild.available) return;

        // it was our own reaction
        if (user.id == client.user.id) return;
        // not an event message
        if (!client.databaseCache.events.has(reaction.message.id)) return;

        // not a hand emoji
        if (reaction.emoji.name != HAND_EMOJI) return;

        const cachedEvent = client.databaseCache.events.get(
            reaction.message.id
        );

        // we already have them saved for some reason?
        if (cachedEvent.participants.includes(user.id)) return;

        const guild = client.guilds.cache.get(cachedEvent.guildID);
        const channel = guild.channels.cache.get(
            cachedEvent.channelID
        ) as TextChannel;
        const msg = await channel.messages.fetch(cachedEvent.messageID);

        // add user to participants array
        cachedEvent.participants.push(user.id);
        // update database
        DBEventManager.addParticipant(cachedEvent, user.id).catch(
            (err) => {
                Logger.log(
                    "error",
                    `Error adding participant to event in (guildID: ${cachedEvent.guildID}) (messageID: ${cachedEvent.messageID}) in database:\n${err}`
                );
            }
        );

        const [participantsString, waitingString] =
            await this.getParticipantsString(
                cachedEvent.participants,
                cachedEvent.maxParticipants
            );

        const eventCreatorMember = await guild.members.fetch(
            cachedEvent.creatorID
        );

        const newEmbed = new MessageEmbed()
            .setColor("PURPLE")
            .setFooter("Event starts")
            .setTimestamp(cachedEvent.endTime)
            .setTitle("Scheduled Event")
            .addField("Event", cachedEvent.event)
            .addField("Time", formatDateLong(cachedEvent.endTime))
            .addField(
                "Scheduled by",
                stripIndents`${eventCreatorMember}
            
            React with a ${HAND_EMOJI} emoji to sign up for the event and be alerted when it starts!`
            );

        if (cachedEvent.maxParticipants === 0) {
            newEmbed.addField(
                `Participants (${cachedEvent.participants.length})`,
                participantsString
            );
        } else {
            newEmbed.addField(
                `Participants (${
                    cachedEvent.participants.length >
                    cachedEvent.maxParticipants
                        ? cachedEvent.maxParticipants
                        : cachedEvent.participants.length
                } / ${cachedEvent.maxParticipants})`,
                participantsString
            );
        }

        // If there are more people signed up than allowed, show them in a waiting list
        if (
            cachedEvent.maxParticipants !== 0 &&
            cachedEvent.participants.length > cachedEvent.maxParticipants
        ) {
            newEmbed.addField(
                `Waiting List (${
                    cachedEvent.participants.length -
                    cachedEvent.maxParticipants
                })`,
                waitingString
            );
        }

        msg.edit({ embeds: [newEmbed] });
        return;
    }

    static async eventHandleMessageReactionRemove(
        client: TundraBot,
        reaction: MessageReaction,
        user: User
    ): Promise<void> {
        const DBEventManager = Deps.get<DBEvent>(DBEvent);

        if (!reaction.message.guild.available) return;

        // it was our own reaction
        if (user.id == client.user.id) return;
        // not an event message
        if (!client.databaseCache.events.has(reaction.message.id)) return;

        if (reaction.emoji.name != HAND_EMOJI) return;

        const cachedEvent = client.databaseCache.events.get(
            reaction.message.id
        );

        // we don't have them saved for some reason?
        if (!cachedEvent.participants.includes(user.id)) return;

        const guild = client.guilds.cache.get(cachedEvent.guildID);
        const channel = guild.channels.cache.get(
            cachedEvent.channelID
        ) as TextChannel;
        const msg = await channel.messages.fetch(cachedEvent.messageID);

        // remove user from participants array
        const index = cachedEvent.participants.indexOf(user.id);
        if (index > -1) {
            cachedEvent.participants.splice(index, 1);
        }
        // update database
        DBEventManager.removeParticipant(cachedEvent, user.id).catch(
            (err) => {
                Logger.log(
                    "error",
                    `Error removing participant from event in (guildID: ${cachedEvent.guildID}) (messageID: ${cachedEvent.messageID}) in database:\n${err}`
                );
            }
        );

        const [participantsString, waitingString] =
            await this.getParticipantsString(
                cachedEvent.participants,
                cachedEvent.maxParticipants
            );

        const eventCreatorMember = `<@${cachedEvent.creatorID}>`;

        const newEmbed = new MessageEmbed()
            .setColor("PURPLE")
            .setFooter("Event starts")
            .setTimestamp(cachedEvent.endTime)
            .setTitle("Scheduled Event")
            .addField("Event", cachedEvent.event)
            .addField("Time", formatDateLong(cachedEvent.endTime))
            .addField(
                "Scheduled by",
                stripIndents`${eventCreatorMember}
            
            React with a ${HAND_EMOJI} emoji to sign up for the event and be alerted when it starts!`
            );

        if (cachedEvent.maxParticipants === 0) {
            newEmbed.addField(
                `Participants (${cachedEvent.participants.length})`,
                participantsString
            );
        } else {
            newEmbed.addField(
                `Participants (${
                    cachedEvent.participants.length >
                    cachedEvent.maxParticipants
                        ? cachedEvent.maxParticipants
                        : cachedEvent.participants.length
                } / ${cachedEvent.maxParticipants})`,
                participantsString
            );
        }

        // If there are more people signed up than allowed, show them in a waiting list
        if (
            cachedEvent.maxParticipants !== 0 &&
            cachedEvent.participants.length > cachedEvent.maxParticipants
        ) {
            newEmbed.addField(
                `Waiting List (${
                    cachedEvent.participants.length -
                    cachedEvent.maxParticipants
                })`,
                waitingString
            );
        }

        msg.edit({ embeds: [newEmbed] });
        return;
    }

    static async eventHandleFinish(
        client: TundraBot,
        event: eventInterface
    ): Promise<void> {
        const DBEventManager = Deps.get<DBEvent>(DBEvent);

        const guild = client.guilds.cache.get(event.guildID);
        if (!guild || !guild.available) return;
        const channel = guild.channels.cache.get(
            event.channelID
        ) as TextChannel;
        if (!channel) return;
        const msg = await channel.messages.fetch(event.messageID);
        if (!msg) return;

        const [participantsString, waitingString] =
            await this.getParticipantsString(
                event.participants,
                event.maxParticipants
            );

        const eventCreatorMember = `<@${event.creatorID}>`;

        const finalEmbed = new MessageEmbed()
            .setColor("GREEN")
            .setFooter("Event started")
            .setTimestamp(event.endTime)
            .setTitle("Event Started")
            .addField("Event", event.event)
            .addField("Time", formatDateLong(event.endTime))
            .addField("Scheduled by", eventCreatorMember);

        // Print differently depending on if there was a cap set or not for participants
        if (event.maxParticipants === 0) {
            // No limit
            finalEmbed.addField(
                `Participants (${event.participants.length})`,
                participantsString
            );
        } else {
            // Limit
            finalEmbed.addField(
                `Participants (${
                    event.participants.length > event.maxParticipants
                        ? event.maxParticipants
                        : event.participants.length
                } / ${event.maxParticipants})`,
                participantsString
            );
        }

        msg.edit({ embeds: [finalEmbed] });

        const eventMessageLink = `https://discord.com/channels/${event.guildID}/${event.channelID}/${event.messageID}`;

        const personalEmbed = new MessageEmbed()
            .setColor("BLUE")
            .setFooter(
                `From the server: ${msg.guild.name}`,
                msg.guild.iconURL()
            )
            .setTitle("Event starting now!")
            .setDescription(
                stripIndents`The event you signed up for: [${event.event}](${eventMessageLink}) is starting now!`
            );

        // Let everyone who responded know the event is starting
        async function alertParticipants() {
            if (
                event.maxParticipants !== 0 &&
                event.participants.length > event.maxParticipants
            ) {
                // Only let those who signed up before the limit was hit know
                const iterator = event.participants[Symbol.iterator]();
                for (let i = 0; i < event.maxParticipants; i++) {
                    const respondent = await client.users.fetch(
                        iterator.next().value
                    ).catch();
                    if (!respondent || respondent.bot) continue;

                    respondent.send({ embeds: [personalEmbed] }).catch();
                }
            } else {
                // Let everyone know
                for (const userID of event.participants) {
                    const respondent = await client.users.fetch(userID);
                    if (respondent.bot) continue;

                    respondent.send({ embeds: [personalEmbed] }).catch();
                }
            }
        }

        alertParticipants();

        // remove event from database and cache
        DBEventManager.delete(event);
    }

    static async getParticipantsString(
        participants: string[],
        maxParticipants: number
    ): Promise<[string, string]> {
        let participantsString = "";
        let waitingString = "";

        // Max number of participants to show when there is no limit, or max number of people to show in waiting list when there is a limit
        const maxShownParticipants = 10;

        if (participants.length === 0) {
            participantsString = "`None`";
        } else if (maxParticipants === 0) {
            // No participants limit
            if (participants.length <= maxShownParticipants) {
                // maxShownParticipants or less
                for (const participant of participants) {
                    participantsString += `<@${participant}>\n`;
                }
            } else {
                // More than maxShownParticipants
                const iterator = participants[Symbol.iterator]();
                for (let i = 0; i < maxShownParticipants; i++) {
                    participantsString += `<@${iterator.next().value}>\n`;
                }
                participantsString += "...";
            }
        } else {
            // There's a participants limit
            if (participants.length <= maxParticipants) {
                // maxParticipants or less
                for (const participant of participants) {
                    participantsString += `<@${participant}>\n`;
                }
            } else {
                // More than maxParticipants
                const iterator = participants[Symbol.iterator]();
                for (let i = 0; i < maxParticipants; i++) {
                    participantsString += `<@${iterator.next().value}>\n`;
                }
                for (
                    let i = 0;
                    i < participants.length - maxParticipants;
                    i++
                ) {
                    if (i === maxShownParticipants) {
                        waitingString += "...";
                        break;
                    }

                    waitingString += `<@${iterator.next().value}>\n`;
                }
            }
        }

        return [participantsString, waitingString];
    }
}
