import { Command, CommandContext } from "../../base/Command";

import { MessageEmbed, PermissionString } from "discord.js";
import { formatDateLong, sendMessage } from "../../utils/functions";

export default class BotInfo implements Command {
    name = "botinfo";
    aliases = ["info", "about"];
    category = "info";
    description = "Returns information about the bot.";
    usage = "botinfo";
    enabled = true;
    guildOnly = false;
    botPermissions: PermissionString[] = ["EMBED_LINKS"];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 10000; // 10 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const bicon = ctx.client.user.displayAvatarURL();

        const embedMsg = new MessageEmbed()
            .setDescription("Bot Information")
            .setColor("#0b7ed6")
            .setThumbnail(bicon)
            .addField("Bot name", ctx.client.user.username)
            .addField(
                "My owner",
                `${process.env.OWNERNAME}${process.env.OWNERTAG}`
            )
            .addField(
                "Dashboard",
                `[Check out my dashboard!](${process.env.DASHBOARD_URL})`
            )
            .addField(
                "Invite link",
                `[Invite me to your server!](${process.env.BOT_INVITE_LINK})`
            )
            .addField(
                "Official Discord server",
                `[Join my official Discord server!](${process.env.SUPPORT_SERVER_INVITE_LINK})`
            )
            .addField(
                "Source code",
                "https://github.com/joshuayuen99/TundraBot"
            )
            .addField("Server count", ctx.client.guilds.cache.size)
            .addField("Created at", formatDateLong(ctx.client.user.createdAt));

        sendMessage(ctx.client, embedMsg, ctx.channel);
        return;
    }
}
