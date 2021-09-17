/* eslint-disable indent */
import { Command, CommandContext } from "../../base/Command";
import {
    Guild,
    GuildMember,
    MessageEmbed,
    PermissionResolvable,
    Permissions,
    TextChannel,
} from "discord.js";
import { commandConfirmMessage, momentDurationToHumanReadable, sendMessage, sendReply } from "../../utils/functions";
import { stripIndents } from "common-tags";
import Logger from "../../utils/logger";
import { TundraBot } from "../../base/TundraBot";
import { DBGuild, guildInterface } from "../../models/Guild";
import Deps from "../../utils/deps";
import { DBMember } from "../../models/Member";
import ms from "ms";
import moment from "moment";

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
    slashCommandEnabled = false;
    guildOnly = true;
    botPermissions: PermissionResolvable[] = [
        Permissions.FLAGS.BAN_MEMBERS,
        Permissions.FLAGS.ADD_REACTIONS,
    ];
    memberPermissions: PermissionResolvable[] = [Permissions.FLAGS.BAN_MEMBERS];
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

        const bMember =
            ctx.msg.mentions.members.first() ||
            ctx.guild.members.cache.get(args[0]);

        // No member found
        if (!bMember) {
            sendReply(
                ctx.client,
                "Couldn't find that member, try again!",
                ctx.msg
            );
            return;
        }

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

        const pattern = /\b([0-9]{1,6}((\.[0-9]))*) *[A-z]+/gm;
        const joinedArgs = args.join(" ");

        let banDuration = 0;
        const timeUnits = joinedArgs.match(pattern) ?? ["0"];
        for (const timeUnit of timeUnits) {
            const unitDuration = ms(timeUnit);
            if (isNaN(unitDuration)) {
                sendReply(
                    ctx.client,
                    "I couldn't recognize that duration. Cancelling reminder.",
                    ctx.msg
                );
                return;
            } else {
                banDuration += unitDuration;
            }
        }

        // outside range
        if (!(banDuration >= 0 && banDuration <= ms("14 days"))) {
            sendReply(
                ctx.client,
                "The duration must be between 0-14 days.",
                ctx.msg
            );
            return;
        }

        let finalTimeUnitIndex = 0;
        while (pattern.exec(joinedArgs) != null) {
            finalTimeUnitIndex = pattern.lastIndex;
        }

        const reason =
            finalTimeUnitIndex === 0
                ? args.slice(1).join(" ")
                : joinedArgs.substring(finalTimeUnitIndex);

        const confirmDescription = `Do you want to ban ${bMember} ${
            banDuration == 0
                ? "permanently"
                : `for ${momentDurationToHumanReadable(moment.duration(banDuration))}`
        }?`;

        const confirmResult = await commandConfirmMessage(
            ctx,
            confirmDescription
        );

        if (confirmResult) {
            await Ban.ban(
                ctx.client,
                ctx.guild,
                ctx.guildSettings as guildInterface,
                bMember,
                reason,
                banDuration,
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
        } else if (!confirmResult) {
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
    static async ban(
        client: TundraBot,
        guild: Guild,
        settings: guildInterface,
        bMember: GuildMember,
        reason: string,
        duration: number,
        moderator: GuildMember
    ): Promise<void> {
        const DBGuildManager = Deps.get<DBGuild>(DBGuild);
        const DBMemberManager = Deps.get<DBMember>(DBMember);

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
                        DBGuildManager.update(guild, {
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
                                : momentDurationToHumanReadable(moment.duration(duration))
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
                                : momentDurationToHumanReadable(moment.duration(duration))
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
                                : momentDurationToHumanReadable(moment.duration(duration))
                        }
                        **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Banned member:** ${bMember} (${
                                bMember.id
                            })
                        **\\> Duration:** ${
                            duration == 0
                                ? "Forever"
                                : momentDurationToHumanReadable(moment.duration(duration))
                        }
                        **\\> Reason:** \`Not specified\``);
                        }
                    }

                    if (logChannel)
                        sendMessage(client, { embeds: [embedMsg] }, logChannel);
                }

                if (duration > 0) {
                    const endTime = new Date(Date.now() + duration);

                    DBMemberManager.ban(bMember, endTime)
                        .then(() => {
                            setTimeout(() => {
                                Ban.unban(
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

    static async unban(
        client: TundraBot,
        guild: Guild,
        settings: guildInterface,
        bUserID: string,
        reason: string,
        moderator: GuildMember
    ): Promise<void> {
        const DBGuildManager = Deps.get<DBGuild>(DBGuild);
        const DBMemberManager = Deps.get<DBMember>(DBMember);

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
                        DBGuildManager.update(guild, {
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

                    if (logChannel)
                        sendMessage(client, { embeds: [embedMsg] }, logChannel);
                }

                // Remove ban from database
                DBMemberManager.unban(user.id, guild.id).catch((err) => {
                    Logger.log(
                        "error",
                        `Error unbanning member in database:\n${err}`
                    );
                });
            })
            .catch((err) => {
                Logger.log("error", `Error unbanning user (userID: ${bUserID}) from (guildID: ${guild.id}):\n${err}`);

                // Remove ban from database
                DBMemberManager.unban(bUserID, guild.id).catch((err) => {
                    Logger.log(
                        "error",
                        `Error unbanning member (userID: ${bUserID}) from (guildID: ${guild.id}) in database:\n${err}`
                    );
                });
            });

        return;
    }
}
