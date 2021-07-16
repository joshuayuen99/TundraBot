import { Command, CommandContext } from "../../base/Command";
import { sendMessage, sendReply } from "../../utils/functions";

export default class Pause implements Command {
    name = "resume";
    aliases = ["unpause"];
    category = "music";
    description = "Resumes the currently paused song.";
    usage = "resume";
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
            ctx.msg.react("▶️");
        } else {
            sendReply(ctx.client, "Resuming...", ctx.msg);
        }
        ctx.client.player.resume(ctx.msg);
        
        return;
    }
}