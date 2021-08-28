import { Permissions } from "discord.js";
import { Command, CommandContext, SlashCommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Resume implements Command {
    name = "resume";
    aliases = ["unpause"];
    category = "music";
    description = "Resumes the currently paused song.";
    usage = "resume";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds
    slashDescription = "Resume the currently paused song";
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

        if (ctx.guild.me.permissions.has(Permissions.FLAGS.ADD_REACTIONS)) {
            ctx.msg.react("▶️");
        } else {
            sendReply(ctx.client, "Resuming...", ctx.msg);
        }
        queue.setPaused(false);
        
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

        queue.setPaused(false);

        await ctx.commandInteraction.editReply(
            "Paused."
        );
        
        return;
    }
}