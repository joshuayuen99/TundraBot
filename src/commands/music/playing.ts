import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";
import { MessageEmbed } from "discord.js";
import { sendReply } from "../../utils/functions";
import FiltersList from "../../assets/filters.json";

export default class Playing implements Command {
    name = "playing";
    aliases = ["nowplaying", "np"];
    category = "music";
    description = "Displays the currently playing song.";
    usage = "playing";
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds
    slashDescription = "Display the currently playing song";
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

        const embedMsg = new MessageEmbed()
            .setColor("BLUE")
            .setTitle("🎵 Now Playing")
            .setThumbnail(currentTrack.thumbnail)
            .setFooter(
                `Queued by: ${currentTrack.requestedBy.tag}`,
                currentTrack.requestedBy.displayAvatarURL()
            )
            .setTimestamp()
            .setDescription(
                `[${currentTrack.title}](${currentTrack.url})`
            )
            .addField("Artist", currentTrack.author, true)
            .addField(
                "Queued by",
                currentTrack.requestedBy.toString(),
                true
            );

        const filters = queue.getFiltersEnabled();
        const filtersLocale = filters.map((filter) => FiltersList[filter]);
        if (filtersLocale[0]) {
            embedMsg.addField("Filters", filtersLocale.join(", "));
        }
        embedMsg.addField(
            "Progress",
            queue.createProgressBar({
                timecodes: true,
            })
        );

        sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const queue = ctx.client.player.getQueue(ctx.guild);
        if (!queue) {
            ctx.commandInteraction.reply("There isn't a song currently playing.");
            return;
        }

        const currentTrack = queue.nowPlaying();

        const embedMsg = new MessageEmbed()
            .setColor("BLUE")
            .setTitle("🎵 Now Playing")
            .setThumbnail(currentTrack.thumbnail)
            .setFooter(
                `Queued by: ${currentTrack.requestedBy.tag}`,
                currentTrack.requestedBy.displayAvatarURL()
            )
            .setTimestamp()
            .setDescription(
                `[${currentTrack.title}](${currentTrack.url})`
            )
            .addField("Artist", currentTrack.author, true)
            .addField(
                "Queued by",
                currentTrack.requestedBy.toString(),
                true
            );

        const filters = queue.getFiltersEnabled();
        const filtersLocale = filters.map((filter) => FiltersList[filter]);
        if (filtersLocale[0]) {
            embedMsg.addField("Filters", filtersLocale.join(", "));
        }
        embedMsg.addField(
            "Progress",
            queue.createProgressBar({
                timecodes: true,
            })
        );

        ctx.commandInteraction.reply({ embeds: [embedMsg] });
        return;
    }
}
