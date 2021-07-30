import { PermissionString } from "discord.js";
import { Command, CommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Betrayal implements Command {
    name = "betrayal";
    category = "fun";
    description = "Starts a new betrayal game for the current voice channel.";
    usage = "betrayal";
    enabled = true;
    guildOnly = true;
    botPermissions: PermissionString[] = ["CONNECT", "SPEAK"];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 10000; // 10 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        // Make sure user is in a voice channel
        const voice = ctx.member.voice.channel;
        if (!voice) {
            sendReply(ctx.client, "You must be connected to a voice channel!", ctx.msg);
            return;
        }

        // Check bot permissions
        const perms = voice.permissionsFor(ctx.client.user);
        if (!perms.has("VIEW_CHANNEL")) {
            sendReply(ctx.client, "I need permission to view your voice channel!", ctx.msg);
            return;
        }

        if (!perms.has("CONNECT")) {
            sendReply(ctx.client, "I need permission to join your voice channel!", ctx.msg);
            return;
        }

        ctx.client.discordTogether.createTogetherCode(voice.id, "betrayal").then(async (invite) => {
            sendReply(ctx.client, invite.code, ctx.msg);
            return;
        });
    }
}