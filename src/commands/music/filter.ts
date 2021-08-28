import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";
import FiltersList from "../../assets/filters.json";
import { ApplicationCommandOption, MessageEmbed } from "discord.js";
import { sendReply } from "../../utils/functions";
import { QueueFilters } from "discord-player";

export default class Filter implements Command {
    name = "filter";
    category = "music";
    description =
        "Toggles the specified filter(s), resets all filters or lists all available filters.";
    usage = "filter [filter name(s) | reset]";
    examples = [
        "filter bassboost",
        "filter bassboost 8D nightcore",
        "filter reset",
    ];
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds
    slashDescription =
        "Lists all available filters or toggles the specified filter(s)";
    commandOptions: ApplicationCommandOption[] = [
        {
            name: "filters",
            type: "STRING",
            description: "The filter(s) to toggle | \"reset\"",
            required: false,
        },
    ];

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

        // list filters
        if (args.length === 0) {
            const embedMsg = await this.listFilters(ctx);
            sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
            return;
        }

        const embedMsg = new MessageEmbed().setColor("BLUE").setTimestamp();

        const filtersUpdated = {};

        const enabledFilters = queue.getFiltersEnabled();
        for (const enabledFilter of enabledFilters) {
            filtersUpdated[enabledFilter] = true;
        }

        if (args[0] === "reset") {
            for (const filter in FiltersList) {
                filtersUpdated[filter] = false;
            }

            await queue.setFilters(filtersUpdated);

            embedMsg
                .setDescription("☑️ Reset all filters!")
                .setFooter(
                    `Filters reset by: ${ctx.author.tag}`,
                    ctx.author.displayAvatarURL()
                );

            sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
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

            const queue = ctx.client.player.getQueue(ctx.guild);
            if (
                queue
                    .getFiltersEnabled()
                    .includes(filterRealName as keyof QueueFilters)
            ) {
                filtersUpdated[filterRealName] = false;
            } else {
                filtersUpdated[filterRealName] = true;
            }

            await queue.setFilters(filtersUpdated);

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

            sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
            return;
        } else if (args.length > 1) {
            // multiple filters
            const filters = args.map((m) => m.toLowerCase());

            const queue = ctx.client.player.getQueue(ctx.guild);

            let descriptionString = "";
            for (const filter of filters) {
                const filterToUpdate = Object.values(FiltersList).find(
                    (f) => f.toLowerCase() === filter.toLowerCase()
                );

                // invalid filter
                if (!filterToUpdate) continue;

                const filterRealName = Object.keys(FiltersList).find(
                    (f) => FiltersList[f] === filterToUpdate
                );

                if (
                    queue
                        .getFiltersEnabled()
                        .includes(filterRealName as keyof QueueFilters)
                ) {
                    filtersUpdated[filterRealName] = false;
                    descriptionString += `${filterToUpdate} : ❌\n`;
                } else if (
                    queue
                        .getFiltersDisabled()
                        .includes(filterRealName as keyof QueueFilters)
                ) {
                    filtersUpdated[filterRealName] = true;
                    descriptionString += `${filterToUpdate} : ✅\n`;
                }
            }

            await queue.setFilters(filtersUpdated);

            embedMsg
                .addField("**Toggled Filters**", descriptionString)
                .setFooter(
                    `Filter${
                        Object.keys(filtersUpdated).length > 1 ? "s" : ""
                    } toggled by: ${ctx.author.tag}`,
                    ctx.author.displayAvatarURL()
                );

            sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
            return;
        }
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const filters = ctx.commandInteraction.options
            .getString("filters")
            ?.trim()
            .replace(/ +/, " ")
            .toLowerCase();

        const queue = ctx.client.player.getQueue(ctx.guild);
        if (!queue) {
            ctx.commandInteraction.reply(
                "There isn't a song currently playing."
            );
            return;
        }

        // list filters
        if (!filters) {
            const embedMsg = await this.listFilters(ctx);
            ctx.commandInteraction.reply({ embeds: [embedMsg] });
            return;
        }

        await ctx.commandInteraction.deferReply();

        const embedMsg = new MessageEmbed().setColor("BLUE").setTimestamp();

        const filtersUpdated = {};

        const enabledFilters = queue.getFiltersEnabled();
        for (const enabledFilter of enabledFilters) {
            filtersUpdated[enabledFilter] = true;
        }

        if (filters === "reset") {
            for (const filter in FiltersList) {
                filtersUpdated[filter] = false;
            }

            await queue.setFilters(filtersUpdated);

            embedMsg
                .setDescription("☑️ Reset all filters!")
                .setFooter(
                    `Filters reset by: ${ctx.author.tag}`,
                    ctx.author.displayAvatarURL()
                );

            ctx.commandInteraction.editReply({ embeds: [embedMsg] });
            return;
        } else if (filters.split(" ").length === 1) {
            // single filter
            const filter = filters;

            const filterToUpdate = Object.values(FiltersList).find(
                (f) => f.toLowerCase() === filter.toLowerCase()
            );
            if (!filterToUpdate) {
                ctx.commandInteraction.editReply(
                    `I couldn't recognize the filter \`${filter}\`.`
                );
                return;
            }

            const filterRealName = Object.keys(FiltersList).find(
                (f) => FiltersList[f] === filterToUpdate
            );

            const queue = ctx.client.player.getQueue(ctx.guild);
            if (
                queue
                    .getFiltersEnabled()
                    .includes(filterRealName as keyof QueueFilters)
            ) {
                filtersUpdated[filterRealName] = false;
            } else {
                filtersUpdated[filterRealName] = true;
            }

            await queue.setFilters(filtersUpdated);

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

            ctx.commandInteraction.editReply({ embeds: [embedMsg] });
            return;
        } else if (filters.split(" ").length > 1) {
            // multiple filters
            const filtersArray = filters.split(" ");

            const queue = ctx.client.player.getQueue(ctx.guild);

            let descriptionString = "";
            for (const filter of filtersArray) {
                const filterToUpdate = Object.values(FiltersList).find(
                    (f) => f.toLowerCase() === filter.toLowerCase()
                );

                // invalid filter
                if (!filterToUpdate) continue;

                const filterRealName = Object.keys(FiltersList).find(
                    (f) => FiltersList[f] === filterToUpdate
                );

                if (
                    queue
                        .getFiltersEnabled()
                        .includes(filterRealName as keyof QueueFilters)
                ) {
                    filtersUpdated[filterRealName] = false;
                    descriptionString += `${filterToUpdate} : ❌\n`;
                } else if (
                    queue
                        .getFiltersDisabled()
                        .includes(filterRealName as keyof QueueFilters)
                ) {
                    filtersUpdated[filterRealName] = true;
                    descriptionString += `${filterToUpdate} : ✅\n`;
                }
            }

            await queue.setFilters(filtersUpdated);

            embedMsg
                .addField("**Toggled Filters**", descriptionString)
                .setFooter(
                    `Filter${
                        Object.keys(filtersUpdated).length > 1 ? "s" : ""
                    } toggled by: ${ctx.author.tag}`,
                    ctx.author.displayAvatarURL()
                );

            ctx.commandInteraction.editReply({ embeds: [embedMsg] });
            return;
        }
    }

    async listFilters(
        ctx: CommandContext | SlashCommandContext
    ): Promise<MessageEmbed> {
        const filtersStatuses = [[], []];

        Object.keys(FiltersList).forEach((filterName) => {
            const array =
                filtersStatuses[0].length > filtersStatuses[1].length
                    ? filtersStatuses[1]
                    : filtersStatuses[0];

            const queue = ctx.client.player.getQueue(ctx.guild);

            array.push(
                `${FiltersList[filterName]} : ${
                    queue
                        .getFiltersEnabled()
                        .find((filter) => filter === filterName)
                        ? "✅"
                        : "❌"
                }`
            );
        });

        const embedMsg = new MessageEmbed()
            .setColor("PURPLE")
            .setTitle("Audio Filters")
            .setDescription(
                "Here is the list of all filters enabled or disabled.\nUse `/filter <filter name>` to change the status of one of them."
            )
            .addField("**Filters**", filtersStatuses[0].join("\n"), true)
            .addField("** **", filtersStatuses[1].join("\n"), true);

        return embedMsg;
    }
}
