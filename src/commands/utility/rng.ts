import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";
import { sendReply } from "../../utils/functions";
import { ApplicationCommandOption, MessageEmbed } from "discord.js";

const DICE = "🎲";

export default class Rng implements Command {
    name = "rng";
    aliases = ["random"];
    category = "utility";
    description =
        "Provides a random number from <min> to <max> or from 0-100 by default.";
    usage = "rng [<min max>]";
    examples = ["rng 10 20"];
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = false;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds
    slashDescription =
        "Provides a random number from <min> to <max> or from 0-100 by default";
    commandOptions: ApplicationCommandOption[] = [
        {
            name: "min",
            type: "INTEGER",
            description: "Minimum number",
            required: false,
        },
        {
            name: "max",
            type: "INTEGER",
            description: "Maximum number",
            required: false,
        },
    ];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        let min: number, max: number;
        if (args[0] !== undefined && args[1] !== undefined) {
            min = parseInt(args[0]);
            max = parseInt(args[1]);

            if (isNaN(min) || isNaN(max)) {
                min = 0;
                max = 100;
            }
        } else {
            min = 0;
            max = 100;
        }

        const result = Math.round(Math.random() * (max - min) + min);

        const embedMsg = new MessageEmbed()
            .setColor(ctx.guild.me.displayHexColor)
            .setFooter(
                ctx.guild.me.displayName,
                ctx.client.user.displayAvatarURL()
            )
            .setTimestamp()
            .setDescription(
                `${DICE} Generated a random number from ${min}-${max} ${DICE}`
            )
            .addField("Result", result.toString());

        if (min > max) {
            sendReply(ctx.client, "min must be smaller than max!", ctx.msg);
            return;
        }

        sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        let min = ctx.commandInteraction.options.getInteger("min");
        let max = ctx.commandInteraction.options.getInteger("max");

        if (min === null || max === null) {
            min = 0;
            max = 100;
        }

        if (min > max) {
            ctx.commandInteraction.reply({
                content: "min must be smaller than max!",
                ephemeral: true,
            });
            return;
        }

        const result = Math.round(Math.random() * (max - min) + min);

        const embedMsg = new MessageEmbed()
            .setColor(ctx.guild.me.displayHexColor)
            .setFooter(
                ctx.guild.me.displayName,
                ctx.client.user.displayAvatarURL()
            )
            .setTimestamp()
            .setDescription(
                `${DICE} Generated a random number from ${min}-${max} ${DICE}`
            )
            .addField("Result", result.toString());

        ctx.commandInteraction.reply({ embeds: [embedMsg] });
        return;
    }
}
