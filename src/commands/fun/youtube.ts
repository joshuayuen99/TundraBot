import { Command, CommandContext } from "../../base/Command";
import { sendReply } from "../../utils/functions";

export default class YouTube implements Command {
    name = "youtube";
    category = "fun";
    description = "Starts a new YouTube video sharing session for the current voice channel.";
    usage = "youtube";
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

        ctx.client.discordTogether.createTogetherCode(voice.id, "youtube").then(async (invite) => {
            sendReply(ctx.client, invite.code, ctx.msg);
            return;
        });
    }
}