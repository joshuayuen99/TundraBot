import { Command, CommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Loop implements Command {
    name = "loop";
    category = "music";
    description = "Toggles looping the current queue.";
    usage = "loop";
    enabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds

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

        ctx.client.player.setLoopMode(ctx.msg, !queue.loopMode);

        sendReply(
            ctx.client,
            queue.loopMode
                ? "Current queue set to loop."
                : "Current queue is no longer looping.",
            ctx.msg
        );
        return;
    }
}
