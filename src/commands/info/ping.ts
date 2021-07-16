import { Command, CommandContext } from "../../base/Command";
import { sendMessage } from "../../utils/functions";

export default class Ping implements Command {
    name = "ping";
    category = "info";
    description = "Returns latency and API ping.";
    usage = "ping";
    enabled = true;
    guildOnly = false;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const sendMsg = await sendMessage(ctx.client, "\u{1F3D3} Pinging...", ctx.channel);

        if (!sendMsg) return;
        sendMsg.edit(
            `\u{1F3D3} Pong!\nLatency is ${Math.round(
                sendMsg.createdTimestamp - ctx.msg.createdTimestamp
            )}.\nAPI Latency is ${Math.round(ctx.client.ws.ping)}.`
        );

        return;
    }
}
