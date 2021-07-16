import { Command, CommandContext } from "../../base/Command";
import { PermissionString } from "discord.js";
import { sendReply } from "../../utils/functions";

export default class Play implements Command {
    name = "play";
    aliases = ["p", "music"];
    category = "music";
    description = "Plays music in the current channel. Currently supports YouTube, Spotify, and SoundCloud links.";
    usage = "play <link | search phrase>";
    examples = [
        "play https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "play https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=08e1adc6617f4019",
        "play https://soundcloud.com/rick-astley-official/never-gonna-give-you-up",
        "play never gonna give you up",
    ];
    enabled = true;
    guildOnly = true;
    botPermissions: PermissionString[] = ["CONNECT", "SPEAK"];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const song = args.join(" ");
        if (!song) {
            sendReply(ctx.client, "Missing link or song name.", ctx.msg);
            return;
        }

        // Make sure user is in a voice channel
        const voice = ctx.member.voice.channel;
        if (!voice) {
            sendReply(ctx.client, "You must be connected to a voice channel!", ctx.msg);
            return;
        }

        // Check bot permissions
        const perms = voice.permissionsFor(ctx.client.user);
        if (!perms.has("CONNECT")) {
            sendReply(ctx.client, "I don't have permission to join your voice channel!", ctx.msg);
            return;
        }

        if (!perms.has("SPEAK")) {
            sendReply(ctx.client, "I don't have permission to speak in your voice channel!", ctx.msg);
            return;
        }

        await ctx.client.player.play(ctx.msg, song);
    }
}