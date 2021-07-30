import { Command, CommandContext } from "../../base/Command";
import { sendMessage, sendReply } from "../../utils/functions";
import { MessageEmbed, TextChannel } from "discord.js";
import Deps from "../../utils/deps";
import { stripIndents } from "common-tags";
import { DBGuild } from "../../models/Guild";

export default class Report implements Command {
    name = "report";
    category = "moderation";
    description = "Reports a member.";
    usage = "report <mention | id> <reason>";
    examples = ["report @TundraBot spamming"];
    enabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 10000; // 10 seconds

    DBGuildManager: DBGuild;
    constructor() {
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
    }

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        // No user specified
        if (!args[0] || !args[1]) {
            sendReply(ctx.client, `Usage: \`${this.usage}\``, ctx.msg);
            return;
        }

        const rMember =
            ctx.msg.mentions.members.first() ||
            await ctx.guild.members.fetch(args[0]).catch(() => {
                throw new Error("Member is not in the server");
            });

        // If the reported member couldn't be found
        if (!rMember) {
            sendReply(ctx.client, "Couldn't find that person.", ctx.msg);
            return;
        }

        const embedMsg = new MessageEmbed()
            .setColor("#ff0000")
            .setTimestamp()
            .setFooter(ctx.guild.name, ctx.guild.iconURL())
            .setAuthor("Reported member", rMember.user.displayAvatarURL())
            .setDescription(stripIndents`**\\> Member:** ${rMember} (${rMember.id})
                            **\\> Reported by:** ${ctx.member} (${ctx.member.id})
                            **\\> Reported in:** ${ctx.channel}
                            **\\> Reason:** ${args.slice(1).join(" ")}`);

        if (ctx.guildSettings.logMessages.enabled) {
            // Log activity
            const logChannel = ctx.guild.channels.cache.find(
                (channel) =>
                    channel.id === ctx.guildSettings.logMessages.channelID
            ) as TextChannel;
            if (!logChannel) {
                // channel was removed, disable logging in settings
                this.DBGuildManager.update(ctx.guild, {
                    logMessages: {
                        enabled: false,
                        channelID: null,
                    },
                });
            }

            const reportMessage = await sendMessage(ctx.client, embedMsg, logChannel);
            if (reportMessage) {
                sendReply(ctx.client, "Your report was submitted.", ctx.msg);
            } else {
                sendReply(
                    ctx.client,
                    "Your server admins haven't set up a log channel for me, or I don't have permission to type in it. Contact them to fix this.",
                    ctx.msg
                );
            }
            if (ctx.msg.deletable) ctx.msg.delete();
        }

        return;
    }
}
