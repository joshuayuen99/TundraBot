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
import {
    commandConfirmMessage,
    createRole,
    momentDurationToHumanReadable,
    sendMessage,
    sendReply,
} from "../../utils/functions";
import ms from "ms";
import { stripIndents } from "common-tags";
import Logger from "../../utils/logger";
import { TundraBot } from "../../base/TundraBot";
import { DBGuild, guildInterface } from "../../models/Guild";
import Deps from "../../utils/deps";
import { DBMember } from "../../models/Member";
import Unmute from "./unmute";
import moment from "moment";

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
    slashCommandEnabled = false;
    guildOnly = true;
    botPermissions: PermissionResolvable[] = [
        Permissions.FLAGS.MUTE_MEMBERS,
        Permissions.FLAGS.MANAGE_ROLES,
        Permissions.FLAGS.ADD_REACTIONS,
    ];
    memberPermissions: PermissionResolvable[] = [
        Permissions.FLAGS.MUTE_MEMBERS,
        Permissions.FLAGS.MANAGE_ROLES,
    ];
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

        const mMember =
            ctx.msg.mentions.members.first() ||
            (await ctx.guild.members.fetch(args[0]).catch());

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

        const pattern = /\b([0-9]{1,6}((\.[0-9]))*) *[A-z]+/gm;
        const joinedArgs = args.join(" ");

        let muteDuration = 0;
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
                muteDuration += unitDuration;
            }
        }

        // outside range
        if (!(muteDuration >= 0 && muteDuration <= ms("14 days"))) {
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

        const confirmDescription = `Do you want to mute ${mMember} ${
            muteDuration == 0
                ? "permanently"
                : `for ${momentDurationToHumanReadable(moment.duration(muteDuration))}`
        }?`;

        const confirmResult = await commandConfirmMessage(
            ctx,
            confirmDescription
        );

        if (confirmResult) {
            await Mute.mute(
                ctx.client,
                ctx.guild,
                ctx.guildSettings as guildInterface,
                mMember,
                reason,
                muteDuration,
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
        } else if (!confirmResult) {
            sendReply(ctx.client, "Not muting after all...", ctx.msg);
        }
    }

    static async mute(
        client: TundraBot,
        guild: Guild,
        settings: guildInterface,
        mMember: GuildMember,
        reason: string,
        duration: number,
        moderator: GuildMember
    ): Promise<void> {
        const DBGuildManager = Deps.get<DBGuild>(DBGuild);
        const DBMemberManager = Deps.get<DBMember>(DBMember);

        if (!guild.available) return;

        // If the role doesn't already exist, make it
        const muteRole = await createRole(guild, {
            name: "tempmute",
            mentionable: false,
        });

        // Set channel overwrites for the role
        if (guild.me.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS)) {
            guild.channels.cache.forEach((channel) => {
                const channelPerms = channel.permissionsFor(client.user);
                if (
                    (channel.type === "GUILD_TEXT" &&
                        channelPerms.has(Permissions.FLAGS.SEND_MESSAGES)) ||
                    (channel.type === "GUILD_VOICE" &&
                        channelPerms.has(Permissions.FLAGS.SPEAK))
                )
                    channel.permissionOverwrites.create(muteRole, {
                        SEND_MESSAGES: false,
                        SPEAK: false,
                    });
            });
        }

        await mMember.roles.add(muteRole);

        if (mMember.voice.channel) mMember.voice.setMute(true);

        // Logs enabled
        if (settings.logMessages.enabled) {
            const logChannel = guild.channels.cache.find(
                (channel) => channel.id === settings.logMessages.channelID
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
                        duration == 0 ? "Forever" : momentDurationToHumanReadable(moment.duration(duration))
                    }
                    **\\> Reason:** ${reason}`);
                } else {
                    embedMsg.setDescription(stripIndents`**\\> Muted member:** ${mMember} (${
                        mMember.id
                    })
                    **\\> Muted by:** ${moderator}
                    **\\> Duration:** ${
                        duration == 0 ? "Forever" : momentDurationToHumanReadable(moment.duration(duration))
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
                        duration == 0 ? "Forever" : momentDurationToHumanReadable(moment.duration(duration))
                    }
                    **\\> Reason:** ${reason}`);
                } else {
                    embedMsg.setDescription(stripIndents`**\\> Muted member:** ${mMember} (${
                        mMember.id
                    })
                    **\\> Duration:** ${
                        duration == 0 ? "Forever" : momentDurationToHumanReadable(moment.duration(duration))
                    }
                    **\\> Reason:** \`Not specified\``);
                }
            }

            if (logChannel)
                sendMessage(client, { embeds: [embedMsg] }, logChannel);
        }

        if (duration > 0) {
            const endTime = new Date(Date.now() + duration);

            DBMemberManager.mute(mMember, endTime)
                .then(() => {
                    setTimeout(() => {
                        Unmute.unmute(
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
