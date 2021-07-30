/* eslint-disable no-case-declarations */
import { MessageEmbed } from "discord.js";
import { TundraBot } from "../base/TundraBot";
import { sendMessage, sendReply } from "../utils/functions";
import Logger from "../utils/logger";
import { StartupHelper } from "./startupHelper";

export default class PlayerInit extends StartupHelper {
    // <guildID, MusicStarting count>
    musicStarting: Map<string, number>;

    constructor(client: TundraBot) {
        super(client);
        this.musicStarting = new Map();
    }

    async init(): Promise<void> {
        this.client.player
            .on("trackStart", (message, track) => {
                const embedMsg = new MessageEmbed()
                    .setColor("BLUE")
                    .setDescription(
                        `🎵 Now playing: [${track.title}](${track.url})`
                    )
                    .setFooter(
                        `Queued by: ${track.requestedBy.tag}`,
                        track.requestedBy.displayAvatarURL()
                    )
                    .setTimestamp();

                sendMessage(this.client, embedMsg, message.channel);
            })
            .on("playlistStart", (message, queue, playlist, track) => {
                const embedMsg = new MessageEmbed()
                    .setColor("GREEN")
                    .setTitle("Playing playlist")
                    .addField("Playlist title", playlist.title)
                    .addField("Song name", track.name);
                sendMessage(this.client, embedMsg, message.channel);
            })
            .on("searchResults", (message, query, tracks) => {
                if (tracks.length > 10) tracks = tracks.slice(0, 10);

                const embedMsg = new MessageEmbed()
                    .setDescription(
                        `Type \`1-${tracks.length}\` for the video result you want to play, \`cancel\` to cancel.`
                    )
                    .addField(
                        "Results",
                        tracks
                            .map(
                                (t, i) =>
                                    `**${i + 1}:** ${t.title} **(${
                                        t.duration
                                    })**`
                            )
                            .join("\n")
                    );

                sendReply(this.client, embedMsg, message);
            })
            .on("searchCancel", (message, query, tracks) => {
                sendReply(this.client, "Cancelling play request...", message);
                return;
            })
            .on(
                "searchInvalidResponse",
                (message, query, tracks, content, collector) => {
                    sendReply(
                        this.client,
                        `Please select a song by sending a number between 1 and ${tracks.length}`,
                        message
                    );
                }
            )
            .on("noResults", (message) => {
                sendReply(
                    this.client,
                    "I couldn't find any results with that title.",
                    message
                );
            })
            .on("botDisconnect", (message) => {
                sendMessage(
                    this.client,
                    "I disconnected from the voice channel...",
                    message.channel
                );
            })
            .on("queueEnd", (message) => {
                // Just leave
            })
            .on("trackAdd", (message, queue, track) => {
                const embedMsg = new MessageEmbed()
                    .setColor("BLUE")
                    .setDescription(
                        `🎵 [${track.title}](${
                            track.url
                        }) has been added to the queue! There ${
                            queue.tracks.length > 1 ? "are" : "is"
                        } currently \`${queue.tracks.length}\` song${
                            queue.tracks.length > 1 ? "s" : ""
                        } in queue.`
                    );
                sendMessage(this.client, embedMsg, message.channel);
            })
            .on("playlistAdd", (message, queue, playlist) => {
                sendMessage(
                    this.client,
                    `**${
                        playlist.tracks.length
                    }** songs have been added to the queue! There are currently ${
                        queue.tracks.length + playlist.tracks.length - 1
                    } songs in queue.`,
                    message.channel
                );
            })
            .on("channelEmpty", () => {
                // do nothing, leaveOnEmpty is not enabled
            })
            .on("error", (error, message) => {
                switch (error) {
                    case "NotConnected":
                        sendMessage(
                            this.client,
                            "You must be connected to a voice channel!",
                            message.channel
                        );
                        break;
                    case "UnableToJoin":
                        sendMessage(
                            this.client,
                            "I can't connect to your voice channel!",
                            message.channel
                        );
                        break;
                    case "NotPlaying":
                        sendMessage(
                            this.client,
                            "No songs are currently playing in this server.",
                            message.channel
                        );
                        break;
                    case "ParseError":
                        sendMessage(
                            this.client,
                            "I had trouble parsing this song/playlist.",
                            message.channel
                        );
                        break;
                    case "LiveVideo":
                        sendMessage(
                            this.client,
                            "Live videos are not yet supported!",
                            message.channel
                        );
                        break;
                    case "VideoUnavailable":
                        sendMessage(
                            this.client,
                            "I'm unable to access this video.",
                            message.channel
                        );
                        break;
                        // case "MusicStarting":
                        //     // Not in the map yet
                        //     if (!this.musicStarting.has(message.guild.id)) {
                        //         this.musicStarting.set(message.guild.id, 1);
                        //         break;
                        //     }

                        //     // Already got MusicStarting error in this guild before
                        //     let musicStartingCount = this.musicStarting.get(
                        //         message.guild.id
                        //     );
                        //     musicStartingCount++;

                        //     // Probably stuck, skip song
                        //     if (musicStartingCount > 2) {
                        //         this.client.player.jump(message, 1);
                        //         musicStartingCount = 0;

                        //         sendReply(this.client, "I'm having trouble playing this song... skipping it.", message);
                        //     }

                        //     this.musicStarting.set(
                        //         message.guild.id,
                        //         musicStartingCount
                        //     );
                        //     break;
                    default:
                        Logger.log("error", error);
                        sendMessage(
                            this.client,
                            `An error occurred... Code: \`${error}\``,
                            message.channel
                        );
                        break;
                }
            });
    }
}
