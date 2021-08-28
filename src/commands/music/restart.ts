import { Permissions } from "discord.js";
import { Command, CommandContext, SlashCommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Restart implements Command {
    name = "restart";
    category = "music";
    description = "Restarts the currently playing song.";
    usage = "restart";
    enabled = false;
    slashCommandEnabled = false;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds
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
            ctx.msg.react("◀️");
        } else {
            sendReply(ctx.client, "Restarting...", ctx.msg);
        }

        await queue.jump(0);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        //
    }
}