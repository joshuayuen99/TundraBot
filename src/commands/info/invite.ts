import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";
import { MessageEmbed, PermissionResolvable, Permissions } from "discord.js";
import { sendMessage } from "../../utils/functions";

export default class Invite implements Command {
    name = "invite";
    aliases = ["link"];
    category = "info";
    description = "Gives you an invite link for TundraBot.";
    usage = "invite";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = false;
    botPermissions: PermissionResolvable[] = [Permissions.FLAGS.EMBED_LINKS];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 15000; // 15 seconds
    slashDescription = "Gives you an invite link for TundraBot";
    commandOptions = [];

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

        sendMessage(ctx.client, { embeds: [embedMsg] }, ctx.channel);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
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

        ctx.commandInteraction.reply({ embeds: [embedMsg] });
        return;
    }
}
