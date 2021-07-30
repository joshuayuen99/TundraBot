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

export default class Kick implements Command {
    name = "kick";
    category = "moderation";
    description = "Kicks a member.";
    usage = "kick <mention | id> [reason]";
    examples = ["kick @TundraBot", "kick @TundraBot Spamming"];
    enabled = true;
    guildOnly = true;
    botPermissions: PermissionString[] = ["KICK_MEMBERS", "ADD_REACTIONS"];
    memberPermissions: PermissionString[] = ["KICK_MEMBERS"];
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

        const reason = args.splice(1).join(" ");

        const kMember =
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

        // Can't kick yourself
        if (kMember.id === ctx.author.id) {
            sendReply(
                ctx.client,
                "Don't kick yourself...It'll be alright.",
                ctx.msg
            );
            return;
        }

        // If user isn't kickable (role difference)
        if (!kMember.kickable) {
            sendReply(
                ctx.client,
                "My role is below theirs in the server's role list! I must be above their top role in order to kick them.",
                ctx.msg
            );
            return;
        }

        const promptEmbed = new MessageEmbed()
            .setColor("GREEN")
            .setFooter("This verification becomes invalid after 30s")
            .setDescription(`Do you want to kick ${kMember}?`);

        const msg = await sendReply(ctx.client, promptEmbed, ctx.msg);
        if (!msg) return;

        const emoji = await promptMessage(ctx.client, msg, ctx.author, 30, [
            CONFIRM,
            CANCEL,
        ]);

        if (emoji === CONFIRM) {
            msg.delete();

            await this.kick(
                ctx.client,
                ctx.guild,
                ctx.guildSettings as guildInterface,
                kMember,
                reason,
                ctx.member
            )
                .then(() => {
                    sendReply(ctx.client, "Member kicked!", ctx.msg);
                })
                .catch((err) => {
                    Logger.log("error", `Kick command error:\n${err}`);
                    sendReply(
                        ctx.client,
                        "Well... something went wrong?",
                        ctx.msg
                    );
                });

            return;
        } else if (!emoji || emoji === CANCEL) {
            msg.delete();

            sendReply(ctx.client, "Not kicking after all...", ctx.msg);
        }
    }

    async kick(
        client: TundraBot,
        guild: Guild,
        settings: guildInterface,
        kMember: GuildMember,
        reason: string,
        moderator: GuildMember
    ): Promise<void> {
        if (!guild.available) return;

        kMember.kick(reason).then(() => {
            if (settings.logMessages.enabled) {
                // Logs enabled
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
                    .setColor("RED")
                    .setTitle("Kick")
                    .setThumbnail(kMember.user.displayAvatarURL())
                    .setTimestamp();

                if (moderator) {
                    if (reason) {
                        embedMsg.setDescription(stripIndents`**\\> Kicked member:** ${kMember} (${kMember.id})
                            **\\> Kicked by:** ${moderator}
                            **\\> Reason:** ${reason}`);
                    } else {
                        embedMsg.setDescription(stripIndents`**\\> Kicked member:** ${kMember} (${kMember.id})
                            **\\> Kicked by:** ${moderator}
                            **\\> Reason:** \`Not specified\``);
                    }
                    embedMsg.setFooter(
                        moderator.displayName,
                        moderator.user.displayAvatarURL()
                    );
                } else {
                    if (reason) {
                        embedMsg.setDescription(stripIndents`**\\> Kicked member:** ${kMember} (${kMember.id})
                            **\\> Reason:** ${reason}`);
                    } else {
                        embedMsg.setDescription(stripIndents`**\\> Kicked member:** ${kMember} (${kMember.id})
                            **\\> Reason:** \`Not specified\``);
                    }
                }

                if (logChannel) sendMessage(client, embedMsg, logChannel);
            }
        });

        return;
    }
}
