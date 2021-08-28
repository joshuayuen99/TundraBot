import { QueueRepeatMode } from "discord-player";
import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Loop implements Command {
    name = "loop";
    category = "music";
    description = "Toggles looping the current queue.";
    usage = "loop";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds
    slashDescription = "Toggles looping the current queue";
    commandOptions = [];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const queue = ctx.client.player.getQueue(ctx.guild);
        if (!queue) {
            sendReply(
                ctx.client,
                "There isn't a song currently playing.",
                ctx.msg
            );
            return;
        }

        const newRepeatMode =
            queue.repeatMode === QueueRepeatMode.QUEUE
                ? QueueRepeatMode.OFF
                : QueueRepeatMode.QUEUE;

        queue.setRepeatMode(newRepeatMode);

        sendReply(
            ctx.client,
            newRepeatMode === QueueRepeatMode.QUEUE
                ? "Current queue set to loop."
                : "Current queue is no longer looping.",
            ctx.msg
        );
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const queue = ctx.client.player.getQueue(ctx.guild);
        if (!queue) {
            ctx.commandInteraction.reply(
                "There isn't a song currently playing."
            );
            return;
        }

        const newRepeatMode =
            queue.repeatMode === QueueRepeatMode.QUEUE
                ? QueueRepeatMode.OFF
                : QueueRepeatMode.QUEUE;

        queue.setRepeatMode(newRepeatMode);

        ctx.commandInteraction.reply(
            newRepeatMode === QueueRepeatMode.QUEUE
                ? "Current queue set to loop."
                : "Current queue is no longer looping."
        );
        return;
    }
}
