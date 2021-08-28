import { Command, CommandContext, SlashCommandContext } from "../../base/Command";
import { PermissionResolvable, Permissions } from "discord.js";
import { sendReply } from "../../utils/functions";

export default class Stop implements Command {
    name = "stop";
    aliases = ["leave"];
    category = "music";
    description = "Stops playing music.";
    usage = "stop";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions: PermissionResolvable[] = [Permissions.FLAGS.ADD_REACTIONS];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds
    slashDescription = "Stop playing music";
    commandOptions = [];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const queue = await ctx.client.player.getQueue(ctx.guild);
        if (!queue) {
            sendReply(
                ctx.client,
                "There isn't a song currently playing.",
                ctx.msg
            );
            return;
        }

        if (ctx.guild.me.permissions.has(Permissions.FLAGS.ADD_REACTIONS)) {
            ctx.msg.react("⏹️");
        } else {
            sendReply(ctx.client, "Stopping...", ctx.msg);
        }
        queue.stop();

        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const queue = await ctx.client.player.getQueue(ctx.guild);
        if (!queue) {
            ctx.commandInteraction.reply(
                "There isn't a song currently playing."
            );
            return;
        }

        await ctx.commandInteraction.reply(
            "Stopping..."
        );

        queue.stop();

        await ctx.commandInteraction.editReply(
            "Player stopped."
        );

        return;
    }
}
