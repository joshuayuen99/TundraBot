import { Permissions } from "discord.js";
import { Command, CommandContext, SlashCommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Pause implements Command {
    name = "pause";
    category = "music";
    description = "Pauses the currently playing song.";
    usage = "pause";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds
    slashDescription = "Pause the currently playing song";
    commandOptions = [];

    // TODO: do something about now playing message on pause

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

        if (ctx.guild.me.permissions.has(Permissions.FLAGS.ADD_REACTIONS)) {
            ctx.msg.react("⏸️");
        } else {
            sendReply(ctx.client, "Pausing...", ctx.msg);
        }
        queue.setPaused(true);
        
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

        await ctx.commandInteraction.reply(
            "Pausing..."
        );

        queue.setPaused(true);

        await ctx.commandInteraction.editReply(
            "Song paused."
        );
        
        return;
    }
}