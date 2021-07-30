import { Command, CommandContext } from "../../base/Command";

import { MessageEmbed, PermissionString } from "discord.js";
import { sendMessage } from "../../utils/functions";

export default class Dashboard implements Command {
    name = "dashboard";
    aliases = ["db"];
    category = "info";
    description = "Gives a link to my dashboard.";
    usage = "dashboard";
    enabled = true;
    guildOnly = false;
    botPermissions: PermissionString[] = ["EMBED_LINKS"];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 15000; // 15 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const embedMsg = new MessageEmbed()
            .setTitle("Dashboard")
            .setDescription(
                `Visit my dashboard [here!](${process.env.DASHBOARD_URL})`
            )
            .setColor("#0b7ed6");

        sendMessage(ctx.client, embedMsg, ctx.channel);
        return;
    }
}
