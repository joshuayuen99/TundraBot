import { Message } from "discord.js";
import { Command } from "../../base/Command";
import { TundraBot } from "../../base/TundraBot";

export class Ping implements Command {
    name: "ping";
    category: "info";
    description: "Returns latency and API ping.";
    usage: "ping";
    premiumOnly: false;
    enabled: true;
    guildOnly: false;
    botPermissions: [];
    memberPermissions: [];
    ownerOnly: false;
    cooldown: 10000; // 10 seconds

    run = async (client: TundraBot, message: Message, args: string[], settings: Object) => {
        const sendMsg = await message.channel.send(`\u{1F3D3} Pinging...`);

        sendMsg.edit(`\u{1F3D3} Pong!\nLatency is ${Math.round(sendMsg.createdTimestamp - message.createdTimestamp)}.\nAPI Latency is ${Math.round(client.ws.ping)}.`);

        return;
    }
}