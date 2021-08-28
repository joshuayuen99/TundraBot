import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";

import { MessageEmbed } from "discord.js";
import { formatDateLong, sendReply } from "../../utils/functions";

export default class ServerInfo implements Command {
    name = "serverinfo";
    aliases = ["server"];
    category = "info";
    description =
        "Displays information about the server and when the user who requsted it joined.";
    usage = "serverinfo";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 10000; // 10 seconds
    slashDescription = "Displays information about the server";
    commandOptions = [];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const sicon = ctx.guild.iconURL();

        const embedMsg = new MessageEmbed()
            .setDescription("Server Information")
            .setColor("#0b7ed6")
            .setThumbnail(sicon)
            .addField("Server name", ctx.guild.name)
            .addField("Created on", formatDateLong(ctx.guild.createdAt))
            .addField("You joined", formatDateLong(ctx.member.joinedAt))
            .addField("Total members", ctx.guild.memberCount.toString());

        sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const sicon = ctx.guild.iconURL();

        const embedMsg = new MessageEmbed()
            .setDescription("Server Information")
            .setColor("#0b7ed6")
            .setThumbnail(sicon)
            .addField("Server name", ctx.guild.name)
            .addField("Created on", formatDateLong(ctx.guild.createdAt))
            .addField("You joined", formatDateLong(ctx.member.joinedAt))
            .addField("Total members", ctx.guild.memberCount.toString());

        ctx.commandInteraction.reply({ embeds: [embedMsg] });
        return;
    }
}
