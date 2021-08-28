import { Permissions } from "discord.js";
import { Command, CommandContext, SlashCommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Skip implements Command {
    name = "skip";
    aliases = ["next"];
    category = "music";
    description = "Skips the currently playing song.";
    usage = "skip";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds
    slashDescription = "Skip the currently playing song";
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
            ctx.msg.react("⏭️");
        } else {
            sendReply(ctx.client, "Skipping...", ctx.msg);
        }
        queue.skip();

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
            "Skipping..."
        );

        queue.skip();

        await ctx.commandInteraction.editReply(
            "Song skipped."
        );

        return;
    }
}
