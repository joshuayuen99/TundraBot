/* eslint-disable indent */
import { Command, CommandContext } from "../../base/Command";
import {
    Guild,
    GuildMember,
    MessageEmbed,
    PermissionString,
    TextChannel,
} from "discord.js";
import { promptMessage, sendMessage, sendReply } from "../../utils/functions";
import ms from "ms";
import { stripIndents } from "common-tags";
import Logger from "../../utils/logger";
import { TundraBot } from "../../base/TundraBot";
import { DBGuild, guildInterface } from "../../models/Guild";
import Deps from "../../utils/deps";
import { DBMember } from "../../models/Member";
import Unmute from "./unmute";

export default class Mute implements Command {
    name = "mute";
    aliases = ["tempmute"];
    category = "moderation";
    description =
        "Temporarily mutes the member so they can't talk or type for an optional duration between 0-14 days.";
    usage = "mute <mention | id> [duration (#s/m/h/d)] [reason]";
    examples = [
        "mute @TundraBot",
        "mute @TundraBot 30m",
        "mute @TundraBot 7d",
        "mute @TundraBot Spamming",
        "mute @TundraBot @TundraBot 12h Spamming",
    ];
    enabled = true;
    guildOnly = true;
    botPermissions: PermissionString[] = ["MUTE_MEMBERS", "MANAGE_ROLES", "ADD_REACTIONS"];
    memberPermissions: PermissionString[] = ["MUTE_MEMBERS", "MANAGE_ROLES"];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds

    DBGuildManager: DBGuild;
    DBMemberManager: DBMember;
    UnmuteCommand: Unmute;
    constructor() {
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
        this.DBMemberManager = Deps.get<DBMember>(DBMember);
        this.UnmuteCommand = Deps.get<Unmute>(Unmute);
    }

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const CONFIRM = "💯";
        const CANCEL = "\u274c"; // red "X" emoji

        // No user specified
        if (!args[0]) {
            sendReply(
                ctx.client,
                stripIndents`Usage: \`${
                    this.usage
                }\`\nExamples:\n${this.examples.join("\n")}`,
                ctx.msg
            );
            return;
        }

        let duration;
        let reason;
        if (args[1]) {
            if (ms(args[1])) {
                // duration specified
                if (ms(args[1]) > 0 && ms(args[1]) <= ms("14 days")) {
                    duration = ms(args[1]);
                    reason = args.splice(2).join(" ");
                } else {
                    // outside range
                    sendReply(
                        ctx.client,
                        "The duration must be between 0-14 days.",
                        ctx.msg
                    );
                    return;
                }
            } else {
                // duration not specified
                duration = 0;
                reason = args.splice(1).join(" ");
            }
        } else {
            duration = 0;
            reason = "";
        }

        const mMember =
            ctx.msg.mentions.members.first() ||
            await ctx.guild.members.fetch(args[0]).catch(() => {
                throw new Error("Member is not in the server");
            });

        // No member found
        if (!mMember) {
            sendReply(
                ctx.client,
                "Couldn't find that member, try again!",
                ctx.msg
            );
            return;
        }

        // Can't mute yourself
        if (mMember.id === ctx.author.id) {
            sendReply(
                ctx.client,
                "Don't mute yourself...It'll be alright.",
                ctx.msg
            );
            return;
        }

        // If user isn't muteable (role difference)
        if (!mMember.manageable) {
            sendReply(
                ctx.client,
                "My role is below theirs in the server's role list! I must be above their top role in order to mute them.",
                ctx.msg
            );
            return;
        }

        const promptEmbed = new MessageEmbed()
            .setColor("GREEN")
            .setAuthor("This verification becomes invalid after 30s")
            .setDescription(
                `Do you want to mute ${mMember} ${
                    duration == 0
                        ? "permanently"
                        : `for ${ms(duration, { long: true })}`
                }?`
            );

        const msg = await sendReply(ctx.client, promptEmbed, ctx.msg);
        if (!msg) return;

        const emoji = await promptMessage(ctx.client, msg, ctx.author, 30, [
            CONFIRM,
            CANCEL,
        ]);

        if (emoji === CONFIRM) {
            msg.delete();

            await this.mute(
                ctx.client,
                ctx.guild,
                ctx.guildSettings as guildInterface,
                mMember,
                reason,
                duration,
                ctx.member
            )
                .then(() => {
                    sendReply(ctx.client, "Member muted!", ctx.msg);
                })
                .catch((err) => {
                    Logger.log("error", `Mute command error:\n${err}`);
                    sendReply(
                        ctx.client,
                        "Well... something went wrong?",
                        ctx.msg
                    );
                });

            return;
        } else if (!emoji || emoji === CANCEL) {
            msg.delete();

            sendReply(ctx.client, "Not muting after all...", ctx.msg);
        }
    }

    async mute(
        client: TundraBot,
        guild: Guild,
        settings: guildInterface,
        mMember: GuildMember,
        reason: string,
        duration: number,
        moderator: GuildMember
    ): Promise<void> {
        if (!guild.available) return;

        // If the role doesn't already exist, make it
        if (!guild.roles.cache.some((role) => role.name === "tempmute")) {
            await guild.roles.create({
                data: {
                    name: "tempmute",
                    mentionable: false,
                },
            });
        }

        const role = guild.roles.cache.find((role) => role.name === "tempmute");

        // Set channel overwrites for the role
        guild.channels.cache.forEach((channel) => {
            channel.createOverwrite(role, {
                SEND_MESSAGES: false,
                SPEAK: false,
            });
        });

        await mMember.roles.add(role);

        if (mMember.voice.channel) mMember.voice.setMute(true);

        // Logs enabled
        if (settings.logMessages.enabled) {
            const logChannel = guild.channels.cache.find(
                (channel) => channel.id === settings.logMessages.channelID
            ) as TextChannel;
            if (!logChannel) {
                // channel was removed, disable logging in settings
                this.DBGuildManager.update(guild, {
                    logMessages: {
                        enabled: false,
                        channelID: null,
                    },
                });
            }

            const embedMsg = new MessageEmbed()
                .setColor("PURPLE")
                .setTitle("Mute")
                .setThumbnail(mMember.user.displayAvatarURL())
                .setTimestamp();

            if (moderator) {
                if (reason) {
                    embedMsg.setDescription(stripIndents`**\\> Muted member:** ${mMember} (${
                        mMember.id
                    })
                    **\\> Muted by:** ${moderator}
                    **\\> Duration:** ${
                        duration == 0 ? "Forever" : ms(duration, { long: true })
                    }
                    **\\> Reason:** ${reason}`);
                } else {
                    embedMsg.setDescription(stripIndents`**\\> Muted member:** ${mMember} (${
                        mMember.id
                    })
                    **\\> Muted by:** ${moderator}
                    **\\> Duration:** ${
                        duration == 0 ? "Forever" : ms(duration, { long: true })
                    }
                    **\\> Reason:** \`Not specified\``);
                }
                embedMsg.setFooter(
                    moderator.displayName,
                    moderator.user.displayAvatarURL()
                );
            } else {
                // No moderator specified
                if (reason) {
                    embedMsg.setDescription(stripIndents`**\\> Muted member:** ${mMember} (${
                        mMember.id
                    })
                    **\\> Duration:** ${
                        duration == 0 ? "Forever" : ms(duration, { long: true })
                    }
                    **\\> Reason:** ${reason}`);
                } else {
                    embedMsg.setDescription(stripIndents`**\\> Muted member:** ${mMember} (${
                        mMember.id
                    })
                    **\\> Duration:** ${
                        duration == 0 ? "Forever" : ms(duration, { long: true })
                    }
                    **\\> Reason:** \`Not specified\``);
                }
            }

            if (logChannel) sendMessage(client, embedMsg, logChannel);
        }

        if (duration > 0) {
            const endTime = new Date(Date.now() + duration);

            this.DBMemberManager.mute(mMember, endTime)
                .then(() => {
                    setTimeout(() => {
                        this.UnmuteCommand.unmute(
                            client,
                            guild,
                            settings,
                            mMember,
                            "Mute duration expired",
                            null
                        );
                    }, duration);
                })
                .catch((err) => {
                    Logger.log(
                        "error",
                        `Error saving unmute time to database:\n${err}`
                    );
                });
        }
    }
}
