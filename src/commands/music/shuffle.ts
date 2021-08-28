import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";
import { MessageEmbed } from "discord.js";
import { sendMessage, sendReply } from "../../utils/functions";

export default class Shuffle implements Command {
    name = "shuffle";
    category = "music";
    description = "Shuffles the current queue.";
    usage = "shuffle";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds
    slashDescription = "Shuffle the current queue";
    commandOptions = [];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const queue = ctx.client.player.getQueue(ctx.guild);
        if (!queue) {
            sendMessage(
                ctx.client,
                "There isn't a queue to shuffle.",
                ctx.channel
            );
            return;
        }

        queue.shuffle();

        const embedMsg = new MessageEmbed()
            .setColor("BLUE")
            .setDescription("🔀 Current queue has been shuffled.");

        sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
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

        queue.shuffle();

        const embedMsg = new MessageEmbed()
            .setColor("BLUE")
            .setDescription("🔀 Current queue has been shuffled.");

        ctx.commandInteraction.reply({ embeds: [embedMsg] });
        return;
    }
}
