import { Command, CommandContext } from "../../base/Command";
import { MessageEmbed } from "discord.js";
import { sendMessage, sendReply } from "../../utils/functions";

export default class Shuffle implements Command {
    name = "shuffle";
    category = "music";
    description = "Shuffles the current queue.";
    usage = "shuffle";
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
            sendMessage(
                ctx.client,
                "There isn't a queue to shuffle.",
                ctx.channel
            );
            return;
        }

        ctx.client.player.shuffle(ctx.msg);

        const embedMsg = new MessageEmbed()
            .setColor("BLUE")
            .setDescription("🔀 Current queue has been shuffled.");

        sendReply(ctx.client, embedMsg, ctx.msg);
        return;
    }
}