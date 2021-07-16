import { Command, CommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Repeat implements Command {
    name = "repeat";
    category = "music";
    description = "Toggles repeating the current song.";
    usage = "repeat";
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

        ctx.client.player.setRepeatMode(ctx.msg, !queue.repeatMode);

        sendReply(
            ctx.client,
            queue.repeatMode
                ? "Current song set to repeat."
                : "Current song no longer repeating.",
            ctx.msg
        );
        return;
    }
}
