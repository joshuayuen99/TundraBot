/* eslint-disable no-case-declarations */
import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";

import {
    ApplicationCommandOption,
    GuildMember,
    MessageEmbed,
    PermissionResolvable,
    Permissions,
} from "discord.js";
import {
    getMember,
    formatDateShort,
    sendReply,
    momentDurationToHumanReadable,
} from "../../utils/functions";
import { stripIndents } from "common-tags";
import { DBMember, memberInterface } from "../../models/Member";
import Deps from "../../utils/deps";
import Logger from "../../utils/logger";
import { messageInterface, messageModel } from "../../models/Message";
import { FilterQuery } from "mongoose";
import moment from "moment";

export default class WhoIs implements Command {
    name = "whois";
    aliases = ["userinfo", "who"];
    category = "info";
    description =
        "Returns user information. If no one is specified, it will return user information about the person who used this command.";
    usage = "whois [username | id | mention]";
    examples = [];
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions: PermissionResolvable[] = [Permissions.FLAGS.EMBED_LINKS];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds
    slashDescription = "Shows information about a user";
    commandOptions: ApplicationCommandOption[] = [
        {
            name: "user",
            type: "USER",
            description: "The user to get info about",
            required: false,
        },
    ];

    DBMemberManager: DBMember;
    constructor() {
        this.DBMemberManager = Deps.get<DBMember>(DBMember);
    }

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const member = await getMember(ctx.msg, args.join(" "));

        // Member variables
        const joined = formatDateShort(member.joinedAt);
        const roles =
            member.roles.cache
                .filter((r) => r.id !== ctx.guild.id) // Filters out the @everyone role
                .map((r) => r)
                .join(", ") || "`none`";

        const searchParams = {
            userID: member.id,
            guildID: member.guild.id,
        } as FilterQuery<messageInterface>;

        const [savedMember, savedMessages]: [
            memberInterface | void,
            messageInterface[] | void
        ] = await Promise.all([
            this.DBMemberManager.get(member),
            messageModel.find(searchParams),
        ]).catch((err) => {
            Logger.log(
                "error",
                `Error getting member (${member.id}) from database:\n${err}`
            );

            return [null, null];
        });

        let messageCount: number;
        let voiceDuration: string;
        let streamDuration: string;

        if (savedMember) {
            const dateNow = new Date(Date.now());

            // Update voice duration
            if (member.voice) {
                savedMember.voiceActivity.leaveTime = dateNow;

                if (savedMember.voiceActivity.joinTime) {
                    savedMember.voiceActivity.voiceDuration +=
                        savedMember.voiceActivity.leaveTime.getTime() -
                        savedMember.voiceActivity.joinTime.getTime();
                }

                savedMember.voiceActivity.joinTime = dateNow;

                // Check if they're streaming
                if (member.voice.streaming) {
                    savedMember.voiceActivity.streamEndTime = dateNow;

                    if (savedMember.voiceActivity.streamStartTime) {
                        savedMember.voiceActivity.streamDuration +=
                            savedMember.voiceActivity.streamEndTime.getTime() -
                            savedMember.voiceActivity.streamStartTime.getTime();
                    }

                    savedMember.voiceActivity.streamStartTime = dateNow;
                }
            }

            this.DBMemberManager.save(savedMember);

            voiceDuration = momentDurationToHumanReadable(
                moment.duration(savedMember.voiceActivity.voiceDuration)
            );
            streamDuration = momentDurationToHumanReadable(
                moment.duration(savedMember.voiceActivity.streamDuration)
            );
        } else {
            voiceDuration = null;
            streamDuration = null;
        }

        if (savedMessages) {
            messageCount = savedMessages.length;
        } else {
            messageCount = 0;
        }

        // User variables
        const created = formatDateShort(member.user.createdAt);
        const avatarURL = member.user.displayAvatarURL();

        const embedMsg = new MessageEmbed()
            .setFooter(member.displayName, member.user.displayAvatarURL())
            .setThumbnail(member.user.displayAvatarURL())
            .setColor(
                member.displayHexColor === "#000000"
                    ? "#ffffff"
                    : member.displayHexColor
            )
            .setDescription(`${member}`)
            .setTimestamp()

            .addField(
                "Member information",
                stripIndents`**\\> Display name:** ${member.displayName}
                    **\\> Joined the server:** ${joined}
                    **\\> Roles: ** ${roles}`,
                true
            )

            .addField(
                "User information",
                stripIndents`**\\> ID:** ${member.user.id}
                    **\\> Username:** ${member.user.username}
                    **\\> Discord Tag:** ${member.user.tag}
                    **\\>** [Avatar link](${avatarURL})
                    **\\> Created account:** ${created}`,
                true
            );

        if (messageCount !== null) {
            embedMsg.addField("Messages sent", messageCount.toString());
        }
        if (voiceDuration !== null) {
            embedMsg.addField("Time spent in voice channels", voiceDuration);
        }
        if (streamDuration !== null) {
            embedMsg.addField(
                "Time spent streaming in voice channels",
                streamDuration
            );
        }

        // User activities
        if (member.presence) {
            for (const activity of member.presence.activities) {
                switch (activity.type) {
                    case "PLAYING":
                        embedMsg.addField(
                            "Playing",
                            stripIndents`**\\>** ${activity.name}`
                        );
                        break;
                    case "STREAMING":
                        embedMsg.addField(
                            `Streaming on ${activity.name}`,
                            stripIndents`**\\>** ${activity.state}
                    **\\>** [${activity.details}](${activity.url})`
                        );
                        break;
                    case "LISTENING":
                        embedMsg.addField(
                            `Listening to ${activity.name}`,
                            stripIndents`**\\> Song:** ${activity.details}
                    **\\> Artist:** ${activity.state}`
                        );
                        break;
                    case "WATCHING":
                        embedMsg.addField(
                            "Watching",
                            stripIndents`**\\>** ${activity.name}`
                        );
                        break;
                    case "CUSTOM":
                        let statusString = "";
                        if (activity.emoji) {
                            statusString += activity.emoji.name;
                            if (activity.state) {
                                statusString += ` ${activity.state}`;
                            }
                        } else statusString += activity.state;
                        embedMsg.addField(
                            "Custom status",
                            stripIndents`**\\>** ${statusString}`
                        );
                        break;
                    default:
                        break;
                }
            }
        }

        sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        let member = ctx.commandInteraction.options.getMember(
            "user"
        ) as GuildMember;

        if (!member) member = ctx.member;

        // Member variables
        const joined = formatDateShort(member.joinedAt);
        const roles =
            member.roles.cache
                .filter((r) => r.id !== ctx.guild.id) // Filters out the @everyone role
                .map((r) => r)
                .join(", ") || "`none`";

        const searchParams = {
            userID: member.id,
            guildID: member.guild.id,
        } as FilterQuery<messageInterface>;

        const [savedMember, savedMessages]: [
            memberInterface | void,
            messageInterface[] | void
        ] = await Promise.all([
            this.DBMemberManager.get(member),
            messageModel.find(searchParams),
        ]).catch((err) => {
            Logger.log(
                "error",
                `Error getting member (${member.id}) from database:\n${err}`
            );

            return [null, null];
        });

        let messageCount: number;
        let voiceDuration: string;
        let streamDuration: string;

        if (savedMember) {
            const dateNow = new Date(Date.now());

            // Update voice duration
            if (member.voice) {
                savedMember.voiceActivity.leaveTime = dateNow;

                if (savedMember.voiceActivity.joinTime) {
                    savedMember.voiceActivity.voiceDuration +=
                        savedMember.voiceActivity.leaveTime.getTime() -
                        savedMember.voiceActivity.joinTime.getTime();
                }
                
                savedMember.voiceActivity.joinTime = dateNow;

                // Check if they're streaming
                if (member.voice.streaming) {
                    savedMember.voiceActivity.streamEndTime = dateNow;

                    if (savedMember.voiceActivity.streamStartTime) {
                        savedMember.voiceActivity.streamDuration +=
                            savedMember.voiceActivity.streamEndTime.getTime() -
                            savedMember.voiceActivity.streamStartTime.getTime();
                    }

                    savedMember.voiceActivity.streamStartTime = dateNow;
                }
            }

            this.DBMemberManager.save(savedMember);

            voiceDuration = momentDurationToHumanReadable(
                moment.duration(savedMember.voiceActivity.voiceDuration)
            );
            streamDuration = momentDurationToHumanReadable(
                moment.duration(savedMember.voiceActivity.streamDuration)
            );
        } else {
            voiceDuration = null;
            streamDuration = null;
        }

        if (savedMessages) {
            messageCount = savedMessages.length;
        } else {
            messageCount = 0;
        }

        // User variables
        const created = formatDateShort(member.user.createdAt);
        const avatarURL = member.user.displayAvatarURL({ format: "png" });

        const embedMsg = new MessageEmbed()
            .setFooter(member.displayName, member.user.displayAvatarURL())
            .setThumbnail(member.user.displayAvatarURL())
            .setColor(
                member.displayHexColor === "#000000"
                    ? "#ffffff"
                    : member.displayHexColor
            )
            .setDescription(`${member}`)
            .setTimestamp()

            .addField(
                "Member information",
                stripIndents`**\\> Display name:** ${member.displayName}
                    **\\> Joined the server:** ${joined}
                    **\\> Roles: ** ${roles}`,
                true
            )

            .addField(
                "User information",
                stripIndents`**\\> ID:** ${member.user.id}
                    **\\> Username:** ${member.user.username}
                    **\\> Discord Tag:** ${member.user.tag}
                    **\\>** [Avatar link](${avatarURL})
                    **\\> Created account:** ${created}`,
                true
            );

        if (messageCount !== null) {
            embedMsg.addField("Messages sent", messageCount.toString());
        }
        if (voiceDuration !== null) {
            embedMsg.addField("Time spent in voice channels", voiceDuration);
        }
        if (streamDuration !== null) {
            embedMsg.addField(
                "Time spent streaming in voice channels",
                streamDuration
            );
        }

        // User activities
        if (member.presence) {
            for (const activity of member.presence.activities) {
                switch (activity.type) {
                    case "PLAYING":
                        embedMsg.addField(
                            "Playing",
                            stripIndents`**\\>** ${activity.name}`
                        );
                        break;
                    case "STREAMING":
                        embedMsg.addField(
                            `Streaming on ${activity.name}`,
                            stripIndents`**\\>** ${activity.state}
                    **\\>** [${activity.details}](${activity.url})`
                        );
                        break;
                    case "LISTENING":
                        embedMsg.addField(
                            `Listening to ${activity.name}`,
                            stripIndents`**\\> Song:** ${activity.details}
                    **\\> Artist:** ${activity.state}`
                        );
                        break;
                    case "WATCHING":
                        embedMsg.addField(
                            "Watching",
                            stripIndents`**\\>** ${activity.name}`
                        );
                        break;
                    case "CUSTOM":
                        let statusString = "";
                        if (activity.emoji) {
                            statusString += activity.emoji.name;
                            if (activity.state) {
                                statusString += ` ${activity.state}`;
                            }
                        } else statusString += activity.state;
                        embedMsg.addField(
                            "Custom status",
                            stripIndents`**\\>** ${statusString}`
                        );
                        break;
                    default:
                        break;
                }
            }
        }

        ctx.commandInteraction.reply({ embeds: [embedMsg] });
        return;
    }
}
