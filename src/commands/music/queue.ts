import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";
import { MessageEmbed } from "discord.js";
import { sendReply } from "../../utils/functions";
import moment from "moment";
import { Paginator, PaginatorContext } from "../../utils/paginator";

export default class Queue implements Command {
    name = "queue";
    aliases = ["q", "upnext"];
    category = "music";
    description = "Displays the current queue.";
    usage = "queue";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds
    slashDescription = "Display the current queue";
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

        const currentTrack = queue.nowPlaying();
        const currentTrackInQueue = `**1:** [${currentTrack.title}](${
            currentTrack.url
        })  **(${this.humanizeDuration(
            queue.streamTime
        )} / ${this.humanizeDuration(currentTrack.durationMS)})**`;

        const queueDuration = this.humanizeDuration(
            queue.totalTime + (currentTrack.durationMS - queue.streamTime)
        );

        const embedMsg = new MessageEmbed().setColor("BLUE");

        const firstEmbedDescription = `**Current queue [${queueDuration}] (${
            queue.tracks.length + 1
        } song${
            queue.tracks.length > 1 ? "s" : ""
        }):**\n${currentTrackInQueue}\n${queue.tracks
            .slice(0, 9)
            .map(
                (t, i) =>
                    `**${i + 2}:** [${t.title}](${t.url}) **(${t.duration})**`
            )
            .join("\n")}`;

        const pages: MessageEmbed[] = [];
        pages.push(
            new MessageEmbed(embedMsg).setDescription(firstEmbedDescription)
        );

        for (let index = 9; index < queue.tracks.length; index += 10) {
            const embedDescription = `**Current queue [${queueDuration}] (${
                queue.tracks.length + 1
            } song${queue.tracks.length > 1 ? "s" : ""}):**\n${queue.tracks
                .slice(index, index + 10)
                .map(
                    (t, i) =>
                        `**${index + i + 2}:** [${t.title}](${t.url}) **(${
                            t.duration
                        })**`
                )
                .join("\n")}`;
            pages.push(
                new MessageEmbed(embedMsg).setDescription(embedDescription)
            );
        }

        if (pages.length > 1) {
            const paginatorContext: PaginatorContext = {
                client: ctx.client,
                msg: ctx.msg,
                member: ctx.member,
                guild: ctx.guild,
                channel: ctx.channel,
                author: ctx.author,
            };
            const paginator = new Paginator(paginatorContext, pages, {
                authorOnlyActions: false,
            });

            await paginator.reply();
        } else {
            await sendReply(ctx.client, { embeds: [pages[0]] }, ctx.msg);
        }
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const queue = ctx.client.player.getQueue(ctx.guild);
        if (!queue) {
            ctx.commandInteraction.reply(
                "There isn't a song currently playing."
            );
            return;
        }

        const currentTrack = queue.nowPlaying();
        const currentTrackInQueue = `**1:** [${currentTrack.title}](${
            currentTrack.url
        })  **(${this.humanizeDuration(
            queue.streamTime
        )} / ${this.humanizeDuration(currentTrack.durationMS)})**`;

        const queueDuration = this.humanizeDuration(
            queue.totalTime + (currentTrack.durationMS - queue.streamTime)
        );

        const embedMsg = new MessageEmbed().setColor("BLUE");

        const firstEmbedDescription = `**Current queue [${queueDuration}] (${
            queue.tracks.length + 1
        } song${
            queue.tracks.length > 1 ? "s" : ""
        }):**\n${currentTrackInQueue}\n${queue.tracks
            .slice(0, 9)
            .map(
                (t, i) =>
                    `**${i + 2}:** [${t.title}](${t.url}) **(${t.duration})**`
            )
            .join("\n")}`;

        const pages: MessageEmbed[] = [];
        pages.push(
            new MessageEmbed(embedMsg).setDescription(firstEmbedDescription)
        );

        for (let index = 9; index < queue.tracks.length; index += 10) {
            const embedDescription = `**Current queue [${queueDuration}] (${
                queue.tracks.length + 1
            } song${queue.tracks.length > 1 ? "s" : ""}):**\n${queue.tracks
                .slice(index, index + 10)
                .map(
                    (t, i) =>
                        `**${index + i + 2}:** [${t.title}](${t.url}) **(${
                            t.duration
                        })**`
                )
                .join("\n")}`;
            pages.push(
                new MessageEmbed(embedMsg).setDescription(embedDescription)
            );
        }

        if (pages.length > 1) {
            const paginatorContext: PaginatorContext = {
                client: ctx.client,
                commandInteraction: ctx.commandInteraction,
                member: ctx.member,
                guild: ctx.guild,
                channel: ctx.channel,
                author: ctx.author,
            };
            const paginator = new Paginator(paginatorContext, pages, {
                authorOnlyActions: false,
            });

            await paginator.interactionReply();
        } else {
            await ctx.commandInteraction.reply({ embeds: [pages[0]] });
        }

        return;
    }

    /**
     *
     * @param duration duration in milliseconds
     */
    humanizeDuration(duration: number): string {
        const momentDuration = moment.duration(duration, "milliseconds");

        let durationString = "";

        if (momentDuration.hours() > 0) {
            durationString +=
                momentDuration.hours().toString().padStart(2, "0") + ":";
        }

        durationString +=
            momentDuration.minutes().toString().padStart(2, "0") + ":";

        durationString += momentDuration.seconds().toString().padStart(2, "0");

        return durationString;
    }
}
