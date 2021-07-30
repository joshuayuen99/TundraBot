import { Command, CommandContext } from "../../base/Command";
import { hmsToSeconds, sendMessage, sendReply } from "../../utils/functions";
import ms from "ms";
import Logger from "../../utils/logger";

export default class Seek implements Command {
    name = "seek";
    category = "music";
    description = "Seeks to the specified time for the currently playing song.";
    usage = "seek <time>";
    examples = ["1:30", "1:10:15", "seek 0s", "seek 30s", "seek 1m 30s", "seek 1min 30seconds"];
    enabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 0 seconds

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

        if (!args[0]) {
            sendReply(
                ctx.client,
                "Please enter a time to seek to.",
                ctx.msg
            );
            return;
        }

        let time = 0;
        // HH:MM:SS input
        if (/^([0-9]{1,2}:)?[0-9]{1,2}:[0-9]{1,2}$/.exec(args[0])) {
            time = hmsToSeconds(args[0]) * 1000;
        } else {
            for (const arg of args) {
                time += ms(arg);
            }
            if (isNaN(time)) {
                sendReply(
                    ctx.client,
                    "Invalid time.",
                    ctx.msg
                );
                return;
            }
        }

        const seekingMessage = await sendReply(ctx.client, `Seeking to ${args.join(" ")}...`, ctx.msg);

        // Change the song position
        await ctx.client.player.setPosition(ctx.msg, time);

        if (!seekingMessage) return;
        seekingMessage.edit(`Seeked to ${args.join(" ")} in the current song.`);
        return;
    }
}