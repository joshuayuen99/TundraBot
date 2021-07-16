import { Command, CommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class Chess implements Command {
    name = "chess";
    category = "fun";
    description = "Starts a new chess game for the current voice channel.";
    usage = "chess";
    enabled = true;
    guildOnly = true;
    botPermissions = [];
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

        ctx.client.discordTogether.createTogetherCode(voice.id, "chess").then(async (invite) => {
            sendReply(ctx.client, invite.code, ctx.msg);
            return;
        });
    }
}