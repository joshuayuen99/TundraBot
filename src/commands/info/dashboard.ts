import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";

import { MessageEmbed, PermissionResolvable, Permissions } from "discord.js";
import { sendMessage } from "../../utils/functions";

export default class Dashboard implements Command {
    name = "dashboard";
    aliases = ["db"];
    category = "info";
    description = "Gives a link to my dashboard.";
    usage = "dashboard";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = false;
    botPermissions: PermissionResolvable[] = [Permissions.FLAGS.EMBED_LINKS];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 15000; // 15 seconds
    slashDescription = "Gives a link to my dashboard";
    commandOptions = [];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const embedMsg = new MessageEmbed()
            .setTitle("Dashboard")
            .setDescription(
                `Visit my dashboard [here!](${process.env.DASHBOARD_URL})`
            )
            .setColor("#0b7ed6");

        sendMessage(ctx.client, { embeds: [embedMsg] }, ctx.channel);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const embedMsg = new MessageEmbed()
            .setTitle("Dashboard")
            .setDescription(
                `Visit my dashboard [here!](${process.env.DASHBOARD_URL})`
            )
            .setColor("#0b7ed6");

        ctx.commandInteraction.reply({ embeds: [embedMsg] });
        return;
    }
}
