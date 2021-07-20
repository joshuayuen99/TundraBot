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
import { stripIndents } from "common-tags";
import Logger from "../../utils/logger";
import { TundraBot } from "../../base/TundraBot";
import { DBGuild, guildInterface } from "../../models/Guild";
import Deps from "../../utils/deps";
import { DBMember } from "../../models/Member";
import ms from "ms";

export default class Ban implements Command {
    name = "ban";
    category = "moderation";
    description = "Bans the member for an optional duration between 0-14 days.";
    usage = "ban <mention | id> [duration (#s/m/h/d)] [reason]";
    examples = [
        "ban @TundraBot",
        "ban @TundraBot Spamming",
        "ban @TundraBot 7d",
        "ban @TundraBot 12h Spamming",
    ];
    enabled = true;
    guildOnly = true;
    botPermissions: PermissionString[] = ["BAN_MEMBERS", "ADD_REACTIONS"];
    memberPermissions: PermissionString[] = ["BAN_MEMBERS"];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds

    DBGuildManager: DBGuild;
    DBMemberManager: DBMember;
    constructor() {
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
        this.DBMemberManager = Deps.get<DBMember>(DBMember);
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
                }\`\nExamples:\n\`\`\`${this.examples.join("\n")}\`\`\``,
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

        const bMember =
            ctx.msg.mentions.members.first() ||
            (await ctx.guild.members.fetch(args[0]).catch(() => {
                // No member found
                sendReply(
                    ctx.client,
                    "Couldn't find that member, try again!",
                    ctx.msg
                );
                throw new Error("Member is not in the server");
            }));

        // Can't ban yourself
        if (bMember.id === ctx.author.id) {
            sendReply(
                ctx.client,
                "Don't ban yourself...It'll be alright.",
                ctx.msg
            );
            return;
        }

        // If user isn't bannable (role difference)
        if (!bMember.bannable) {
            sendReply(
                ctx.client,
                "My role is below theirs in the server's role list! I must be above their top role in order to ban them.",
                ctx.msg
            );
            return;
        }

        const promptEmbed = new MessageEmbed()
            .setColor("GREEN")
            .setFooter("This verification becomes invalid after 30s")
            .setDescription(
                `Do you want to ban ${bMember} ${
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

            await this.ban(
                ctx.client,
                ctx.guild,
                ctx.guildSettings as guildInterface,
                bMember,
                reason,
                duration,
                ctx.member
            )
                .then(() => {
                    sendReply(ctx.client, "Member banned!", ctx.msg);
                })
                .catch((err) => {
                    Logger.log("error", `Ban command error:\n${err}`);
                    sendReply(
                        ctx.client,
                        "Well... something went wrong?",
                        ctx.msg
                    );
                });

            return;
        } else if (!emoji || emoji === CANCEL) {
            msg.delete();

            sendReply(ctx.client, "Not banning after all...", ctx.msg);
        }
    }

    /**
     * @param client Discord Client instance
     * @param guild Discord Guild object
     * @param settings guild settings
     * @param bMember Discord Guild member to ban
     * @param reason ban reason
     * @param duration duration to ban for (0 for permanent)
     * @param moderator Discord Guild member that issued the ban
     */
    async ban(
        client: TundraBot,
        guild: Guild,
        settings: guildInterface,
        bMember: GuildMember,
        reason: string,
        duration: number,
        moderator: GuildMember
    ): Promise<void> {
        if (!guild.available) return;

        bMember
            .ban({
                reason: reason,
            })
            .then(() => {
                // Logs enabled
                if (settings.logMessages.enabled) {
                    // Log activity
                    const logChannel = guild.channels.cache.find(
                        (channel) =>
                            channel.id === settings.logMessages.channelID
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
                        .setColor("RED")
                        .setTitle("Ban")
                        .setThumbnail(bMember.user.displayAvatarURL())
                        .setTimestamp();

                    if (moderator) {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Banned member:** ${bMember} (${
                                bMember.id
                            })
                        **\\> Banned by:** ${moderator}
                        **\\> Duration:** ${
                            duration == 0
                                ? "Forever"
                                : ms(duration, { long: true })
                        }
                        **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Banned member:** ${bMember} (${
                                bMember.id
                            })
                        **\\> Banned by:** ${moderator}
                        **\\> Duration:** ${
                            duration == 0
                                ? "Forever"
                                : ms(duration, { long: true })
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
                            embedMsg.setDescription(stripIndents`**\\> Banned member:** ${bMember} (${
                                bMember.id
                            })
                        **\\> Duration:** ${
                            duration == 0
                                ? "Forever"
                                : ms(duration, { long: true })
                        }
                        **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Banned member:** ${bMember} (${
                                bMember.id
                            })
                        **\\> Duration:** ${
                            duration == 0
                                ? "Forever"
                                : ms(duration, { long: true })
                        }
                        **\\> Reason:** \`Not specified\``);
                        }
                    }

                    if (logChannel) sendMessage(client, embedMsg, logChannel);
                }

                if (duration > 0) {
                    const endTime = new Date(Date.now() + duration);

                    this.DBMemberManager.ban(bMember, endTime)
                        .then(() => {
                            setTimeout(() => {
                                this.unban(
                                    client,
                                    guild,
                                    settings,
                                    bMember.user.id,
                                    "Ban duration expired",
                                    null
                                );
                            }, duration);
                        })
                        .catch((err) => {
                            Logger.log(
                                "error",
                                `Error saving unban time to database:\n${err}`
                            );
                        });
                }
            });

        return;
    }

    async unban(
        client: TundraBot,
        guild: Guild,
        settings: guildInterface,
        bUserID: string,
        reason: string,
        moderator: GuildMember
    ): Promise<void> {
        guild.members
            .unban(bUserID, reason)
            .then((user) => {
                // Logs enabled
                if (settings.logMessages.enabled) {
                    const logChannel = guild.channels.cache.find(
                        (channel) =>
                            channel.id === settings.logMessages.channelID
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
                        .setColor("GREEN")
                        .setTitle("Unban")
                        .setTimestamp();

                    if (moderator) {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Unbanned member:** ${user} (${user.id})
                        **\\> Unbanned by:** ${moderator}
                        **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Unbanned member:** ${user} (${user.id})
                        **\\> Unbanned by:** ${moderator}
                        **\\> Reason:** \`Not specified\``);
                        }
                        embedMsg.setFooter(
                            moderator.displayName,
                            moderator.user.displayAvatarURL()
                        );
                    } else {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Unbanned member:** ${user} (${user.id})
                        **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Unbanned member:** ${user} (${user.id})
                        **\\> Reason:** \`Not specified\``);
                        }
                    }

                    if (logChannel) sendMessage(client, embedMsg, logChannel);
                }

                // Remove ban from database
                this.DBMemberManager.unban(user.id, guild.id).catch((err) => {
                    Logger.log(
                        "error",
                        `Error unbanning member in database:\n${err}`
                    );
                });
            })
            .catch((err) => {
                Logger.log("error", `Error unbanning user:\n${err}`);

                // Remove ban from database
                this.DBMemberManager.unban(bUserID, guild.id).catch((err) => {
                    Logger.log(
                        "error",
                        `Error unbanning member in database:\n${err}`
                    );
                });
            });

        return;
    }
}
