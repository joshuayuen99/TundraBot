import { Command, CommandContext } from "../../base/Command";
import { MessageEmbed, PermissionString } from "discord.js";
import { sendMessage, sendReply } from "../../utils/functions";

export default class Stop implements Command {
    name = "stop";
    aliases = ["leave"];
    category = "music";
    description = "Stops playing music.";
    usage = "stop";
    enabled = true;
    guildOnly = true;
    botPermissions: PermissionString[] = ["ADD_REACTIONS"];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const queue = await ctx.client.player.getQueue(ctx.msg);
        if (!queue) {
            sendReply(
                ctx.client,
                "There isn't a song currently playing.",
                ctx.msg
            );
            return;
        }

        if (ctx.guild.me.hasPermission("ADD_REACTIONS")) {
            ctx.msg.react("⏹️");
        } else {
            sendReply(ctx.client, "Stopping...", ctx.msg);
        }
        ctx.client.player.stop(ctx.msg);
    }
}
