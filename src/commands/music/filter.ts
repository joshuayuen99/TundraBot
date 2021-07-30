import { Command, CommandContext } from "../../base/Command";
import FiltersList from "../../assets/filters.json";
import { MessageEmbed } from "discord.js";
import { sendReply } from "../../utils/functions";

export default class Filter implements Command {
    name = "filter";
    category = "music";
    description = "Toggles the specified filter(s), resets all filters or lists all available filters.";
    usage = "filter [filter name(s) | reset]";
    examples = [
        "filter bassboost",
        "filter bassboost 8D nightcore",
        "filter reset",
    ];
    enabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 5 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const queue = ctx.client.player.getQueue(ctx.msg);
        if (!queue) {
            sendReply(
                ctx.client,
                "There isn't a song currently playing.",
                ctx.msg
            );
            return;
        }

        // list filters
        if (args.length === 0) {
            this.listFilters(ctx);
            return;
        }

        const embedMsg = new MessageEmbed()
            .setColor("BLUE")
            .setTimestamp();

        const filtersUpdated = {};

        if (args[0] === "reset") {
            for (const filter in FiltersList) {
                filtersUpdated[filter] = false;
            }

            await ctx.client.player.setFilters(ctx.msg, filtersUpdated);

            embedMsg
                .setDescription("☑️ Reset all filters!")
                .setFooter(
                    `Filters reset by: ${ctx.author.tag}`,
                    ctx.author.displayAvatarURL()
                );

            sendReply(ctx.client, embedMsg, ctx.msg);
        } else if (args.length === 1) {
            // single filter
            const filter = args[0];

            const filterToUpdate = Object.values(FiltersList).find(
                (f) => f.toLowerCase() === filter.toLowerCase()
            );
            if (!filterToUpdate) {
                sendReply(
                    ctx.client,
                    `I couldn't recognize the filter \`${filter}\`.`,
                    ctx.msg
                );
                return;
            }

            const filterRealName = Object.keys(FiltersList).find(
                (f) => FiltersList[f] === filterToUpdate
            );

            const queueFilters = ctx.client.player.getQueue(ctx.msg).filters;
            filtersUpdated[filterRealName] = queueFilters[filterRealName]
                ? false
                : true;

            ctx.client.player.setFilters(ctx.msg, filtersUpdated);

            if (filtersUpdated[filterRealName])
                embedMsg.setDescription(
                    `☑️ Filter \`${filterToUpdate}\` enabled.`
                );
            else
                embedMsg.setDescription(
                    `☑️ Filter \`${filterToUpdate}\` disabled.`
                );
            embedMsg.setFooter(
                `Filter toggled by: ${ctx.author.tag}`,
                ctx.author.displayAvatarURL()
            );

            sendReply(ctx.client, embedMsg, ctx.msg);
            return;
        } else if (args.length > 1) {
            // multiple filters
            const filters = args.map((m) => m.toLowerCase());

            const queueFilters = ctx.client.player.getQueue(ctx.msg).filters;

            let descriptionString = "";
            for (const filter in FiltersList) {
                if (filters.includes(FiltersList[filter].toLowerCase())) {
                    filtersUpdated[filter] = queueFilters[filter]
                        ? false
                        : true;

                    descriptionString += `${FiltersList[filter]} : ${
                        queueFilters[filter] ? "❌" : "✅"
                    }\n`;
                }
            }

            ctx.client.player.setFilters(ctx.msg, filtersUpdated);

            embedMsg
                .addField("**Toggled Filters**", descriptionString)
                .setFooter(
                    `Filter${Object.keys(filtersUpdated).length > 1 ? "s": ""} toggled by: ${ctx.author.tag}`,
                    ctx.author.displayAvatarURL()
                );

            sendReply(ctx.client, embedMsg, ctx.msg);
            return;
        }
    }

    async listFilters(ctx: CommandContext): Promise<void> {
        const filtersStatuses = [[], []];

        Object.keys(FiltersList).forEach((filterName) => {
            const array =
                filtersStatuses[0].length > filtersStatuses[1].length
                    ? filtersStatuses[1]
                    : filtersStatuses[0];
            array.push(
                FiltersList[filterName] +
                    " : " +
                    (ctx.client.player.getQueue(ctx.msg).filters[filterName]
                        ? "✅"
                        : "❌")
            );
        });

        const embedMsg = new MessageEmbed()
            .setColor("PURPLE")
            .setTitle("Audio Filters")
            .setDescription(
                `Here is the list of all filters enabled or disabled.\nUse \`${ctx.guildSettings.prefix}filter <filter name>\` to change the status of one of them.`
            )
            .addField("**Filters**", filtersStatuses[0].join("\n"), true)
            .addField("** **", filtersStatuses[1].join("\n"), true);

        sendReply(ctx.client, embedMsg, ctx.msg);
        return;
    }
}
