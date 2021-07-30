import { Command, CommandContext } from "../../base/Command";
import { MessageEmbed } from "discord.js";
import { sendReply } from "../../utils/functions";
import moment from "moment";

export default class Queue implements Command {
    name = "queue";
    aliases = ["q", "upnext"];
    category = "music";
    description = "Displays the current queue.";
    usage = "queue";
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

        const queueDuration = this.humanizeDuration(queue.totalTime);

        const embedMsg = new MessageEmbed()
            .setColor("BLUE")
            .setDescription(
                `**Current queue [${queueDuration}] (${queue.tracks.length} song${
                    queue.tracks.length > 1 ? "s" : ""
                }):**\n${queue.tracks.slice(0, 10).map(
                    (t, i) => `**${i + 1}:** [${t.title}](${t.url}) **(${t.duration})**`
                ).join("\n")}${queue.tracks.length > 10 ? "\n`...`" : ""}`
            );

        sendReply(ctx.client, embedMsg, ctx.msg);
        return;
    }

    /**
     * 
     * @param duration duration in milliseconds
     */
    humanizeDuration(duration: number): string {
        const momentDuration = moment.duration(duration, "milliseconds");

        let durationString = "";

        if (momentDuration.hours() > 0) {
            durationString += momentDuration.hours().toString().padStart(2, "0") + ":";
        }

        durationString += momentDuration.minutes().toString().padStart(2, "0") + ":";

        durationString += momentDuration.seconds().toString().padStart(2, "0");

        return durationString;
    }
}
