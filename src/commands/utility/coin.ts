import { Command, CommandContext } from "../../base/Command";
import { sendMessage } from "../../utils/functions";
import { MessageEmbed } from "discord.js";

export default class Coin implements Command {
    name = "coin";  
    aliases = ["flip"];
    category = "utility";
    description = "Flips a coin!";
    usage = "coin";
    enabled = true;
    guildOnly = false;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const result = Math.round(Math.random());

        let resultString;
        if (result == 0) resultString = "Heads!";
        else resultString = "Tails!";

        const embedMsg = new MessageEmbed()
            .setColor(ctx.member.displayHexColor)
            .setFooter(ctx.member.displayName, ctx.author.displayAvatarURL())
            .setTimestamp()
            .setDescription(`${ctx.author} Flipped a coin!`)
            .addField("Result", resultString);

        sendMessage(ctx.client, embedMsg, ctx.channel);
        return;
    }
}