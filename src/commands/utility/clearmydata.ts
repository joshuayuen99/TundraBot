import { Command, CommandContext } from "../../base/Command";
import { MessageEmbed, PermissionString } from "discord.js";
import { sendMessage } from "../../utils/functions";

export default class ClearMyData implements Command {
    name = "clearmydata";
    category = "utility";
    description =
        "Provides the information needed to clear your data from the bot.";
    usage = "clearmydata";
    enabled = true;
    guildOnly = false;
    botPermissions: PermissionString[] = ["EMBED_LINKS"];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 30000; // 30 seconds

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

        sendMessage(ctx.client, embedMsg, ctx.channel);
        return;
    }
}
