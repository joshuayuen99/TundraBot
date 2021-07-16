import { Command, CommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Restart implements Command {
    name = "restart";
    category = "music";
    description = "Restarts the currently playing song.";
    usage = "restart";
    enabled = false;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const queue = ctx.client.player.getQueue(ctx.msg);
        if (!queue) {
            sendReply(
                ctx.client,
                "There isn't a song currently playing.",
                ctx.msg
            );
            return;
        }

        if (ctx.guild.me.hasPermission("ADD_REACTIONS")) {
            ctx.msg.react("◀️");
        } else {
            sendReply(ctx.client, "Restarting...", ctx.msg);
        }

        await ctx.client.player.setPosition(ctx.msg, 0);
        return;
    }
}