const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const ytdl = require("ytdl-core");
const { waitResponse, shuffle, } = require("../../functions");
const search = require("youtube-search");
const axios = require("axios");
const he = require("he");

const videoOpts = {
    maxResults: 5,
    type: "video",
    key: process.env.YOUTUBEKEY
};

module.exports = {
    name: "play",
    aliases: ["p", "music"],
    category: "music",
    description: "Plays music in the current channel.",
    usage: "play <youtube link | search phrase>",
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        // No link provided
        if (!args[0]) {
            return message.reply("Please enter a Youtube link to play or search phrase.")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        var serverQueue = client.musicGuilds.get(message.guild.id);

        // Not in a voice channel
        if (!message.member.voice.channel) {
            return message.reply("You must be in a voice channel!")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        // No bot permission
        if (!message.guild.me.hasPermission("CONNECT") || !message.guild.me.hasPermission("SPEAK")) {
            return message.reply("I need permission to join and speak in that channel!")
                .then(m => m.delete({
                    timeout: 5000
                }));
        }

        // Check if playlist
        let playlistId = /(?<=list=).*(?=&?)/.exec(args[0]);
        if (playlistId) {
            playlistId = playlistId[0];
            let results = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems?" + "part=contentDetails%2Csnippet" + "&maxResults=50" + "&playlistId=" + playlistId + "&key=" + process.env.YOUTUBEKEY);
            if (results.data.items.length != 0) {
                for (const videoInfo of results.data.items) {
                    const song = {
                        title: videoInfo.snippet.title,
                        url: "https://www.youtube.com/watch?v=" + videoInfo.contentDetails.videoId
                    };
                    // If a queue does not already exist for the server
                    if (!serverQueue) {
                        await createQueue(client, message, song);
                        serverQueue = client.musicGuilds.get(message.guild.id);
                    } else {
                        serverQueue.songs.push(song);
                        if (serverQueue.toggle) {
                            const currentSong = serverQueue.songs.slice(0, 1);
                            serverQueue.songs = currentSong + shuffle(serverQueue.songs.slice(1));
                        }
                    }
                }
                return message.channel.send(`**${results.data.items.length}** songs have been added to the queue! There are currently **${serverQueue.songs.length}** songs in queue.`);
            }
        }

        // Search phrase
        var songInfo;
        if (!ytdl.validateURL(args[0])) {
            let { results, pageInfo } = await search(args.join(" "), videoOpts).catch((err) => {
                return message.channel.send("I had trouble searching for that song. Cancelling.");
            });

            let videos = "";
            let videoDetailsList = [];
            for (let i = 0; i < results.length; i++) {
                let videoDurationString = await getVideoDuration(results[i].id);

                videos = videos + `**${i + 1}:** ${he.decode(results[i].title)} **(${videoDurationString})**\n`;

                const videoInfo = {
                    title: results[i].title,
                    videoId: results[i].id,
                    videoDuration: videoDurationString
                };
                videoDetailsList.push(videoInfo);
            }
            if (!videos) {
                return message.reply("I couldn't find any results with that title.");
            }
            const embedMsg = new MessageEmbed()
                .setDescription(stripIndents`Type \`${settings.prefix}play 1-5\` for the video result you want to play, or anything else to cancel.`)
                .addField("Results", videos);
            // Get user choice
            const choice = await message.reply(embedMsg).then(async msg => {
                let response = await waitResponse(client, msg, message.author, 30);

                // If they didn't respond back in time
                if (!response) {
                    msg.delete();
                    msg.channel.send("Cancelling play request...");
                    return;
                }

                // Check user choice
                switch (response.content) {
                    case `${settings.prefix}play 1`:
                    case `${settings.prefix}p 1`:
                    case `${settings.prefix}play 2`:
                    case `${settings.prefix}p 2`:
                    case `${settings.prefix}play 3`:
                    case `${settings.prefix}p 3`:
                    case `${settings.prefix}play 4`:
                    case `${settings.prefix}p 4`:
                    case `${settings.prefix}play 5`:
                    case `${settings.prefix}p 5`:
                        //songInfo = await ytdl.getInfo(results[parseInt(response.content) - 1].link);
                        songInfo = videoDetailsList[parseInt(response.content.charAt(response.content.length - 1)) - 1];
                        songInfo.title = he.decode(songInfo.title);
                        songInfo.video_url = "https://www.youtube.com/watch?v=" + songInfo.videoId;
                        songInfo.isLiveContent = songInfo.videoDuration == "LIVE" ? true : false;
                        msg.delete();
                        return response;
                    default:
                        msg.delete();
                        msg.channel.send("Cancelling play request...");
                        return;
                }
            });
            // If they didn't respond back correctly
            if (!choice) return;
        }

        let song;
        if (!songInfo) { // User entered a regular video link
            songInfo = await ytdl.getInfo(args[0]).catch((err) => {
                console.error("ytdl.getInfo error: ", err);

                const embedMsg = new MessageEmbed()
                    .setColor("RED")
                    .setDescription("🔇 **I'm currently experiencing issues playing songs... please try again later.**")
                    .addField("Error", err.message);
                message.channel.send(embedMsg);
            });

            if (!songInfo) return;
            
            song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
                isLive: songInfo.videoDetails.isLiveContent,
                duration: songInfo.videoDetails.lengthSeconds
            };
        } else {
            song = {
                title: songInfo.title,
                url: songInfo.video_url,
                isLive: songInfo.isLiveContent ? true : false
            };
        }
        
        await queueSong(client, message, song).then(() => {
            serverQueue = client.musicGuilds.get(message.guild.id);
            if (!serverQueue) return; // we had trouble queueing up the song

            if (serverQueue.songs.length > 1) {
                const embedMsg = new MessageEmbed()
                    .setColor("BLUE")
                    .setDescription(`🎵 [${song.title}](${song.url}) has been added to the queue! There are currently \`${serverQueue.songs.length}\` songs in queue.`);
                return message.channel.send(embedMsg);
            } else {
                const embedMsg = new MessageEmbed()
                    .setColor("BLUE")
                    .setDescription(`🎵 [${song.title}](${song.url}) has been added to the queue! There is currently \`${serverQueue.songs.length}\` song in queue.`);
                return message.channel.send(embedMsg);
            }
        }).catch((err) => {
            console.error("Error queueing song: ", err);

            return message.channel.send(`There was an error playing this song. Try again and if this issue persists, please contact my creator ${process.env.OWNERNAME}${process.env.OWNERTAG}.`);
        });
    }
}

async function createQueue(client, message, song) {
    // Create queue struct
    const queueConstruct = {
        textChannel: message.channel,
        voiceChannel: message.member.voice.channel,
        connection: null,
        songs: [],
        volume: 2,
        playing: true,
        shuffle: false,
        repeat: false
    };
    // Add song to queue
    queueConstruct.songs.push(song);

    // Add queue struct to list of servers playing music
    client.musicGuilds.set(message.guild.id, queueConstruct);

    try {
        await queueConstruct.voiceChannel.join()
            .then((connection) => {
                connection.voice.setSelfDeaf(true);
                queueConstruct.connection = connection;
                try {
                    play(client, message.guild.id);
                } catch (err) {
                    console.error("Can't play music. IP banned?: ", err);
                    client.musicGuilds.delete(message.guild.id);

                    const embedMsg = new MessageEmbed()
                        .setColor("RED")
                        .setDescription("🔇 **I'm currently having problems playing songs... please try again later.**")
                        .addField("Error", err.message);
                    message.channel.send(embedMsg);
                    queueConstruct.voiceChannel.leave();
                }
            })
            .catch((err) => {
                console.error("Couldn't connect to the channel...", err);
                client.musicGuilds.delete(message.guild.id);
                message.channel.send("Couldn't connect to the channel...");
                return;
        });
    }
    catch (err) {
        console.error("Failed to join channel and start playing music: ", err);
        client.musicGuilds.delete(message.guild.id);
        return;
    }
}

function play(client, guildID) {
    const serverQueue = client.musicGuilds.get(guildID);
    const song = serverQueue.songs[0];

    // No more songs left in queue
    if (!song) {
        serverQueue.voiceChannel.leave();
        client.musicGuilds.delete(guildID);
        return;
    }

    let options;
    if (song.isLive) {
        options = {
            begin: Date.now()
        };
    } else {
        options = {
            filter: "audioonly",
            highWaterMark: 1 << 25
        };
    }

    // Create dispatcher to play song
    const dispatcher = serverQueue.connection.play(ytdl(song.url, options))
        .on("finish", () => {
            if (!serverQueue.repeat) serverQueue.songs.shift();
            play(client, guildID);
        })
        .on("error", (err) => {
            console.error("Error playing song: ", err);
            client.musicGuilds.delete(serverQueue.textChannel.guild.id);

            const embedMsg = new MessageEmbed()
                .setColor("RED")
                .setDescription("🔇 **I'm currently experiencing issues playing songs... please try again later.**")
                .addField("Error", err.message);
            serverQueue.textChannel.send(embedMsg);
            serverQueue.voiceChannel.leave();
        });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 10);
}

async function queueSong(client, message, song) {
    const serverQueue = client.musicGuilds.get(message.guild.id);
    // If a queue does not already exist for the server
    if (!serverQueue) {
        await createQueue(client, message, song);
    }
    else {
        serverQueue.songs.push(song);
        if (serverQueue.toggle) {
            const currentSong = serverQueue.songs.slice(0, 1);
            serverQueue.songs = currentSong + shuffle(serverQueue.songs.slice(1));
        }
    }
}

async function getVideoDuration(videoId) {
    let videoDetails = await axios.get("https://www.googleapis.com/youtube/v3/videos?" + "part=contentDetails" + "&id=" + videoId + "&key=" + process.env.YOUTUBEKEY);
    let videoDurationRaw = videoDetails.data.items[0].contentDetails.duration;

    if (videoDurationRaw == "P0D") return "LIVE";
    let hours;
    let minutes;
    let seconds;

    if ((hours = /[0-9]{0,2}(?=H)/.exec(videoDurationRaw)) !== null) hours = hours[0];
    if ((minutes = /[0-9]{0,2}(?=M)/.exec(videoDurationRaw)) !== null) minutes = minutes[0];
    if ((seconds = /[0-9]{0,2}(?=S)/.exec(videoDurationRaw)) !== null) seconds = seconds[0];

    let videoDurationString = "";
    if (hours) videoDurationString = videoDurationString + hours + ":";
    if (minutes) videoDurationString = videoDurationString + minutes + ":";
    if (seconds < 10) videoDurationString = videoDurationString + "0" + seconds;
    else videoDurationString = videoDurationString + seconds;

    return videoDurationString;
}