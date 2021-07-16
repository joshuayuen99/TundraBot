import { Command, CommandContext } from "../../base/Command";

import { MessageEmbed } from "discord.js";
import { formatDateLong, sendMessage } from "../../utils/functions";

export default class ServerInfo implements Command {
    name = "serverinfo";
    aliases = ["server"];
    category = "info";
    description =
        "Returns information about the server and when the user who requsted it joined.";
    usage = "serverinfo";
    enabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 10000; // 10 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const sicon = ctx.guild.iconURL();

        const embedMsg = new MessageEmbed()
            .setDescription("Server Information")
            .setColor("#0b7ed6")
            .setThumbnail(sicon)
            .addField("Server name", ctx.guild.name)
            .addField("Created on", formatDateLong(ctx.guild.createdAt))
            .addField("You joined", formatDateLong(ctx.member.joinedAt))
            .addField("Total members", ctx.guild.memberCount);

        sendMessage(ctx.client, embedMsg, ctx.channel);
        return;
    }
}
