import { Command, CommandContext, SlashCommandContext } from "../../base/Command";
import { MessageEmbed, PermissionResolvable, Permissions } from "discord.js";
import { sendReply } from "../../utils/functions";

export default class ClearMyData implements Command {
    name = "clearmydata";
    category = "utility";
    description =
        "Provides the information needed to clear your data from TundraBot.";
    usage = "clearmydata";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = false;
    botPermissions: PermissionResolvable[] = [Permissions.FLAGS.EMBED_LINKS];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 30000; // 30 seconds
    slashDescription = "Provides the information needed to clear your data from TundraBot";
    commandOptions = [];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const embedMsg = new MessageEmbed()
            .setColor("PURPLE")
            .setTimestamp()
            .setFooter(
                ctx.member.nickname ? ctx.member.nickname : ctx.author.username,
                ctx.author.displayAvatarURL()
            )
            .setDescription(
                `To clear your data (messages), please join [my support server](${process.env.SUPPORT_SERVER_INVITE_LINK}) and ask OR private message \`${process.env.OWNERNAME}${process.env.OWNERTAG}\`. Keep in mind this will impact the \`undelete\` and \`unedit\` commands.`
            );

        sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const embedMsg = new MessageEmbed()
            .setColor("PURPLE")
            .setTimestamp()
            .setFooter(
                ctx.member.nickname ? ctx.member.nickname : ctx.author.username,
                ctx.author.displayAvatarURL()
            )
            .setDescription(
                `To clear your data (messages), please join [my support server](${process.env.SUPPORT_SERVER_INVITE_LINK}) and ask OR private message \`${process.env.OWNERNAME}${process.env.OWNERTAG}\`. Keep in mind this will impact the \`undelete\` and \`unedit\` commands.`
            );

        ctx.commandInteraction.reply({ embeds: [embedMsg] });
        return;
    }
}
