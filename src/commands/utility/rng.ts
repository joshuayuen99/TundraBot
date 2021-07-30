import { Command, CommandContext } from "../../base/Command";
import { sendMessage, sendReply } from "../../utils/functions";
import { MessageEmbed } from "discord.js";

const DICE = "🎲";

export default class Rng implements Command {
    name = "rng";
    aliases = ["random"];
    category = "utility";
    description = "Provides a random number from <min> to <max> or from 0-100 by default.";
    usage = "rng [<min max>]";
    examples = ["rng 10 20"];
    enabled = true;
    guildOnly = false;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        let min, max;
        if (args[0] && args[1]) {
            min = parseInt(args[0]);
            max = parseInt(args[1]);
        } else {
            min = 0;
            max = 100;
        }

        const result = Math.round(Math.random() * (max - min) + min);

        const embedMsg = new MessageEmbed()
            .setColor(ctx.guild.me.displayHexColor)
            .setFooter(ctx.guild.me.displayName, ctx.client.user.displayAvatarURL())
            .setTimestamp()
            .setDescription(`${DICE} Generated a random number from ${min}-${max} ${DICE}`)
            .addField("Result", result);

        if (!(min < max)) {
            sendReply(ctx.client, "min must be smaller than max!", ctx.msg);
            return;
        }

        sendMessage(ctx.client, embedMsg, ctx.channel);
        return;
    }
}