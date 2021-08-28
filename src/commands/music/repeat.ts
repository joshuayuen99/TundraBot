import { QueueRepeatMode } from "discord-player";
import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Repeat implements Command {
    name = "repeat";
    category = "music";
    description = "Toggles repeating the current song.";
    usage = "repeat";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds
    slashDescription = "Toggle repeating the current song";
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
            queue.repeatMode === QueueRepeatMode.TRACK
                ? QueueRepeatMode.OFF
                : QueueRepeatMode.TRACK;

        queue.setRepeatMode(newRepeatMode);

        sendReply(
            ctx.client,
            newRepeatMode === QueueRepeatMode.TRACK
                ? "Current song set to loop."
                : "Current song is no longer looping.",
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
            queue.repeatMode === QueueRepeatMode.TRACK
                ? QueueRepeatMode.OFF
                : QueueRepeatMode.TRACK;

        queue.setRepeatMode(newRepeatMode);

        ctx.commandInteraction.reply(
            newRepeatMode === QueueRepeatMode.TRACK
                ? "Current song set to loop."
                : "Current song is no longer looping."
        );
        return;
    }
}
