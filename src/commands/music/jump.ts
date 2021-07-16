import { Command, CommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Jump implements Command {
    name = "jump";
    aliases = ["jumpto"];
    category = "music";
    description = "Jumps to the numbered song in queue.";
    usage = "jump <song number in queue>";
    examples = ["jump 3", "jump 10"];
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

        const queuePosition = +args[0];
        if (!queuePosition) {
            sendReply(ctx.client, "Please enter the number of the song in queue to jump to.", ctx.msg);
            return;
        }

        sendReply(ctx.client, `Jumped to track #${queuePosition}`, ctx.msg);

        ctx.client.player.jump(ctx.msg, queuePosition - 1);
        return;
    }
}