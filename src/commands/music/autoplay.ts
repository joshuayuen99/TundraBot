import { QueueRepeatMode } from "discord-player";
import { MessageEmbed } from "discord.js";
import { Command, CommandContext, SlashCommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class AutoPlay implements Command {
    name = "autoplay";
    category = "music";
    description = "Toggles autoplay for music.";
    usage = "autoplay";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds
    slashDescription = "Toggles autoplay for music";
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

        const newRepeatMode = queue.repeatMode === QueueRepeatMode.AUTOPLAY ? QueueRepeatMode.OFF : QueueRepeatMode.AUTOPLAY;

        queue.setRepeatMode(newRepeatMode);

        const embedMsg = new MessageEmbed()
            .setColor("BLUE")
            .setDescription(
                `☑️ Autoplay is now \`${
                    newRepeatMode === QueueRepeatMode.AUTOPLAY ? "enabled" : "disabled"
                }\`!`
            )
            .setFooter(
                ctx.author.tag,
                queue.nowPlaying().requestedBy.displayAvatarURL()
            )
            .setTimestamp();

        sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const queue = ctx.client.player.getQueue(ctx.guild);
        if (!queue) {
            ctx.commandInteraction.reply("There isn't a song currently playing.");
            return;
        }

        const newRepeatMode = queue.repeatMode === QueueRepeatMode.AUTOPLAY ? QueueRepeatMode.OFF : QueueRepeatMode.AUTOPLAY;

        queue.setRepeatMode(newRepeatMode);

        const embedMsg = new MessageEmbed()
            .setColor("BLUE")
            .setDescription(
                `☑️ Autoplay is now \`${
                    newRepeatMode === QueueRepeatMode.AUTOPLAY ? "enabled" : "disabled"
                }\`!`
            )
            .setFooter(
                ctx.author.tag,
                queue.nowPlaying().requestedBy.displayAvatarURL()
            )
            .setTimestamp();

        ctx.commandInteraction.reply({ embeds: [embedMsg] });
        return;
    }
}
