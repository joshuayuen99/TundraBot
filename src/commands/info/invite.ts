import { Command, CommandContext } from "../../base/Command";
import { MessageEmbed, PermissionString } from "discord.js";
import { sendMessage } from "../../utils/functions";

export default class Invite implements Command {
    name = "invite";
    aliases = ["link"];
    category = "info";
    description = "Gives you an invite link for the bot.";
    usage = "invite";
    enabled = true;
    guildOnly = false;
    botPermissions: PermissionString[] = ["EMBED_LINKS"];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 15000; // 15 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const bicon = ctx.client.user.displayAvatarURL();

        const embedMsg = new MessageEmbed()
            .addField(
                "Invite link",
                `[Invite me to your server!](${process.env.BOT_INVITE_LINK})`
            )
            .addField(
                "Official Discord server",
                `[Join my official Discord server!](${process.env.SUPPORT_SERVER_INVITE_LINK})`
            )
            .setColor("#0b7ed6")
            .setThumbnail(bicon);

        sendMessage(ctx.client, embedMsg, ctx.channel);
        return;
    }
}
