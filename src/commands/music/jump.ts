import { ApplicationCommandOption } from "discord.js";
import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Jump implements Command {
    name = "jump";
    aliases = ["jumpto"];
    category = "music";
    description = "Jumps to the numbered song in queue.";
    usage = "jump <song number in queue>";
    examples = ["jump 3", "jump 10"];
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds
    slashDescription = "Jumps to the numbered song in queue";
    commandOptions: ApplicationCommandOption[] = [
        {
            name: "tracknumber",
            type: "INTEGER",
            description: "The track number to jump to",
            required: true,
        },
    ];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const queue = ctx.client.player.getQueue(ctx.guild);
        if (!queue) {
            sendReply(
                ctx.client,
                "There aren't any songs to jump to!",
                ctx.msg
            );
            return;
        }

        const queuePosition = +args[0];
        if (!queuePosition) {
            sendReply(
                ctx.client,
                "Please enter the number of the song in queue to jump to.",
                ctx.msg
            );
            return;
        }

        sendReply(ctx.client, `Jumped to track #${queuePosition}`, ctx.msg);

        queue.jump(queuePosition - 2);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const trackNumber = ctx.commandInteraction.options.getInteger("tracknumber");
        
        const queue = ctx.client.player.getQueue(ctx.guild);
        if (!queue) {
            ctx.commandInteraction.reply("There aren't any songs to jump to!");
            return;
        }

        if (!trackNumber) {
            ctx.commandInteraction.reply("Please enter the number of the song in queue to jump to.");
            return;
        }

        await ctx.commandInteraction.reply(":rabbit2: | Jumping tracks...");

        queue.jump(trackNumber - 2);

        ctx.commandInteraction.editReply(`Jumped to track #${trackNumber}!`);
        return;
    }
}
