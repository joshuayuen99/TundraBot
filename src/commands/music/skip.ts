import { Command, CommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Skip implements Command {
    name = "skip";
    aliases = ["next"];
    category = "music";
    description = "Skips the currently playing song.";
    usage = "skip";
    enabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 0; // 0 seconds

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
            ctx.msg.react("⏭️");
        } else {
            sendReply(ctx.client, "Skipping...", ctx.msg);
        }
        ctx.client.player.skip(ctx.msg);

        return;
    }
}
