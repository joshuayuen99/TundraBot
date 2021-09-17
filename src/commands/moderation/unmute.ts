import { Command, CommandContext } from "../../base/Command";

import { stripIndents } from "common-tags";
import Logger from "../../utils/logger";
import { TundraBot } from "../../base/TundraBot";
import { DBGuild, guildInterface } from "../../models/Guild";
import Deps from "../../utils/deps";
import { DBMember } from "../../models/Member";
import {
    Guild,
    GuildMember,
    MessageEmbed,
    PermissionResolvable,
    Permissions,
    TextChannel,
} from "discord.js";
import { sendMessage, sendReply } from "../../utils/functions";

export default class Unmute implements Command {
    name = "unmute";
    category = "moderation";
    description = "Unmutes the member so they can talk and type again.";
    usage = "unmute <mention | id> [reason]";
    examples = ["unmute @TundraBot", "unmute @TundraBot Felt nice"];
    enabled = true;
    slashCommandEnabled = false;
    guildOnly = true;
    botPermissions: PermissionResolvable[] = [
        Permissions.FLAGS.MUTE_MEMBERS,
        Permissions.FLAGS.MANAGE_ROLES,
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

        const reason = args.splice(1).join(" ");

        const mMember =
            ctx.msg.mentions.members.first() ||
            ctx.guild.members.cache.get(args[0]);

        // No member found
        if (!mMember) {
            sendReply(
                ctx.client,
                "Couldn't find that member, try again!",
                ctx.msg
            );
            return;
        }

        // If user isn't unmuteable (role difference)
        if (!mMember.manageable) {
            sendReply(
                ctx.client,
                "My role is below theirs in the server's role list! I must be above their top role in order to unmute them.",
                ctx.msg
            );
            return;
        }

        // If user isn't muted
        if (!mMember.roles.cache.some((role) => role.name === "tempmute")) {
            sendReply(ctx.client, "They aren't muted!", ctx.msg);
            return;
        }

        await Unmute.unmute(
            ctx.client,
            ctx.guild,
            ctx.guildSettings as guildInterface,
            mMember,
            reason,
            ctx.member
        )
            .then(() => {
                sendReply(ctx.client, "Member unmuted!", ctx.msg);
                return;
            })
            .catch((err) => {
                Logger.log("error", `Unmute command unmute error:\n${err}`);
                sendReply(ctx.client, "Well... something went wrong?", ctx.msg);
                return;
            });
    }

    static async unmute(
        client: TundraBot,
        guild: Guild,
        settings: guildInterface,
        mMember: GuildMember,
        reason: string,
        moderator: GuildMember
    ): Promise<void> {
        const DBGuildManager = Deps.get<DBGuild>(DBGuild);
        const DBMemberManager = Deps.get<DBMember>(DBMember);

        if (!guild.available) return;

        const role = guild.roles.cache.find((role) => role.name === "tempmute");

        if (!role) return;

        mMember.roles
            .remove(role, reason)
            .then(() => {
                if (mMember.voice.channel) mMember.voice.setMute(false);

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
                        .setTitle("Unmute")
                        .setThumbnail(mMember.user.displayAvatarURL())
                        .setTimestamp();

                    if (moderator) {
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Unmuted member:** ${mMember} (${mMember.id})
                            **\\> Unmuted by:** ${moderator}
                            **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Unmuted member:** ${mMember} (${mMember.id})
                            **\\> Unmuted by:** ${moderator}
                            **\\> Reason:** \`Not specified\``);
                        }
                        embedMsg.setFooter(
                            moderator.displayName,
                            moderator.user.displayAvatarURL()
                        );
                    } else {
                        // No moderator specified
                        if (reason) {
                            embedMsg.setDescription(stripIndents`**\\> Unmuted member:** ${mMember} (${mMember.id})
                            **\\> Reason:** ${reason}`);
                        } else {
                            embedMsg.setDescription(stripIndents`**\\> Unmuted member:** ${mMember} (${mMember.id})
                            **\\> Reason:** \`Not specified\``);
                        }
                    }

                    if (logChannel)
                        sendMessage(client, { embeds: [embedMsg] }, logChannel);
                }

                // Remove mute from database
                DBMemberManager.unmute(mMember).catch((err) => {
                    Logger.log(
                        "error",
                        `Error unmuting member (${mMember.id}) in (${mMember.guild.id}) in database:\n${err}`
                    );
                });
            })
            .catch((err) => {
                Logger.log(
                    "error",
                    `Error removing muted role from member (userID: ${mMember.id}) in (guildID: ${mMember.guild.id}):\n${err}`
                );

                // Remove mute from database
                DBMemberManager.unmute(mMember).catch((err) => {
                    Logger.log(
                        "error",
                        `Error unmuting member (userID: ${mMember.id}) in (guildID: ${mMember.guild.id}) in database:\n${err}`
                    );
                });
            });
    }
}
