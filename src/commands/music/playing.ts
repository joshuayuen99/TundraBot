import { Command, CommandContext } from "../../base/Command";
import { MessageEmbed } from "discord.js";
import { sendMessage, sendReply } from "../../utils/functions";
import FiltersList from "../../assets/filters.json";

export default class Playing implements Command {
    name = "playing";
    aliases = ["nowplaying", "np"];
    category = "music";
    description = "Displays the currently playing song.";
    usage = "playing";
    enabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds

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

        const embedMsg = new MessageEmbed()
            .setColor("BLUE")
            .setTitle("🎵 Now Playing")
            .setThumbnail(queue.tracks[0].thumbnail)
            .setFooter(
                `Queued by: ${queue.tracks[0].requestedBy.tag}`,
                queue.tracks[0].requestedBy.displayAvatarURL()
            )
            .setTimestamp()
            .setDescription(
                `[${queue.tracks[0].title}](${queue.tracks[0].url})`
            )
            .addField("Artist", queue.tracks[0].author, true)
            .addField("Queued by", queue.tracks[0].requestedBy, true);

        const filters = queue.getFiltersEnabled();
        const filtersLocale = filters.map((filter) => FiltersList[filter]);
        if (filtersLocale[0]) {
            embedMsg.addField("Filters", filtersLocale.join(", "));
        }
        embedMsg.addField(
            "Progress",
            ctx.client.player.createProgressBar(ctx.msg, {
                timecodes: true,
            })
        );

        sendReply(ctx.client, embedMsg, ctx.msg);
        return;
    }
}
