import { Command, CommandContext, SlashCommandContext } from "../../base/Command";
import { stripIndents } from "common-tags";
import { MessageEmbed } from "discord.js";
import { DBPlaylist } from "../../models/Playlist";
import Deps from "../../utils/deps";
import { sendReply } from "../../utils/functions";

export default class Playlist implements Command {
    name = "playlist";
    category = "music";
    description =
        "A way to save playlists for your server. `playlist save` will save the current queue and filters to a playlist. `playlist load` will load the playlist into the current queue.";
    usage = stripIndents`playlist
    playlist list
    playlist save <playlist name>
    playlist add <playlist name> <song link>
    playlist remove <playlist name> <song link>
    playlist load <playlist name>
    playlist delete <playlist name>`;
    examples = [
        "playlist",
        "playlist save MyPlaylist",
        "playlist add MyPlaylist https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "playlist remove MyPlaylist https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "playlist load MyPlaylist",
        "playlist delete MyPlaylist",
    ];
    enabled = false;
    slashCommandEnabled = false;
    guildOnly = true;
    botPermissions = [];
    memberPermissions = [];
    ownerOnly = true;
    premiumOnly = true;
    cooldown = 5000; // 5 seconds
    commandOptions = [];

    DBPlaylistManager: DBPlaylist;
    constructor() {
        this.DBPlaylistManager = Deps.get<DBPlaylist>(DBPlaylist);
    }

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        if (!args[0] || args.includes("list")) {
            // no arguments default
            this.listPlaylists(ctx, args);
        } else if (args.includes("save")) {
            this.savePlaylist(ctx, args);
        }
    }

    async listPlaylists(ctx: CommandContext, args: string[]): Promise<void> {
        const embedMsg = new MessageEmbed();

        const savedPlaylists = this.DBPlaylistManager.getGuildPlaylists(
            ctx.guild
        );

        if (savedPlaylists) {
            embedMsg
                .setColor("BLUE")
                .setFooter(
                    `${ctx.guildSettings.prefix}playlist load <playlist name> to load a playlist!`
                )
                .setTitle("Server Playlists")
                .setDescription(
                    (await savedPlaylists)
                        .map((playlist) => `\`${playlist.name}\``)
                        .join(" ")
                );
        } else {
            embedMsg
                .setColor("RED")
                .setTitle("No playlists available")
                .setDescription(
                    `No playlists saved for this server! Use ${ctx.guildSettings.prefix}playlist save to create a new playlist using the current queue!`
                );
        }

        sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
        return;
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        //
    }

    async savePlaylist(ctx: CommandContext, args: string[]): Promise<void> {}
}
