import { Command, CommandContext, SlashCommandContext } from "../../base/Command";
import { sendMessage } from "../../utils/functions";

export default class Ping implements Command {
    name = "ping";
    category = "info";
    description = "Displays latency and API ping.";
    usage = "ping";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = false;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds
    slashDescription = "Displays API ping";
    commandOptions = [];

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

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        await ctx.commandInteraction.reply("\u{1F3D3} Pinging...");
        await ctx.commandInteraction.editReply(`\u{1F3D3} Pong! API Latency is ${Math.round(ctx.client.ws.ping)}.`);

        return;
    }
}
