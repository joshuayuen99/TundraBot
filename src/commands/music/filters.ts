import { Command, CommandContext, SlashCommandContext } from "../../base/Command";
import FiltersList from "../../assets/filters.json";
import { MessageEmbed } from "discord.js";
import { sendReply } from "../../utils/functions";

export default class Filters implements Command {
    name = "filters";
    category = "music";
    description =
        "Lists the available filters and their current toggled status.";
    usage = "filters";
    enabled = false;
    slashCommandEnabled = false;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds
    slashDescription = "Lists the available filters and their current toggled status.";
    commandOptions = [];

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const queue = ctx.client.player.getQueue(ctx.guild);
        if (!queue) {
            sendReply(
                ctx.client,
                "There isn't a song currently playing.",
                ctx.msg
            );
            return;
        }

        const filtersStatuses = [[], []];

        Object.keys(FiltersList).forEach((filterName) => {
            const array =
                filtersStatuses[0].length > filtersStatuses[1].length
                    ? filtersStatuses[1]
                    : filtersStatuses[0];
            const queue = ctx.client.player.getQueue(ctx.guild);
            array.push(
                FiltersList[filterName] +
                    " : " +
                    queue
                        .getFiltersEnabled()
                        .find((filter) => filter === filter)
                    ? "✅"
                    : "❌"
            );
        });

        const embedMsg = new MessageEmbed()
            .setColor("PURPLE")
            .setTitle("Audio Filters")
            .setDescription(
                `Here is the list of all filters enabled or disabled.\nUse \`${ctx.guildSettings.prefix}filter\` to change the status of one of them.`
            )
            .addField("**Filters**", filtersStatuses[0].join("\n"), true)
            .addField("** **", filtersStatuses[1].join("\n"), true);

        sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        //
    }
}
