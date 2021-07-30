import { Command, CommandContext } from "../../base/Command";
import { sendMessage, sendReply } from "../../utils/functions";

export default class Pause implements Command {
    name = "pause";
    category = "music";
    description = "Pauses the currently playing song.";
    usage = "pause";
    enabled = true;
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
            ctx.msg.react("⏸️");
        } else {
            sendReply(ctx.client, "Pausing...", ctx.msg);
        }
        ctx.client.player.pause(ctx.msg);
        
        return;
    }
}