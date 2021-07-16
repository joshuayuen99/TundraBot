import { MessageEmbed } from "discord.js";
import { Command, CommandContext } from "../../base/Command";
import { sendMessage, sendReply } from "../../utils/functions";

export default class AutoPlay implements Command {
    name = "autoplay";
    category = "music";
    description = "Toggles autoplay for music.";
    usage = "autoplay";
    enabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 0 seconds

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

        ctx.client.player.setAutoPlay(ctx.msg, !queue.autoPlay);

        const embedMsg = new MessageEmbed()
            .setColor("BLUE")
            .setDescription(`☑️ Autoplay is now \`${queue.autoPlay ? "enabled" : "disabled"}\`!`)
            .setFooter(
                ctx.author.tag,
                queue.tracks[0].requestedBy.displayAvatarURL()
            )
            .setTimestamp();

        sendReply(ctx.client, embedMsg, ctx.msg);
        return;
    }
}