const { RichEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const ytdl = require("ytdl-core");
const { waitResponse, shuffle } = require("../../functions");
const search = require("youtube-search");
const axios = require("axios");

//const youtubeKey = "AIzaSyCssZkseV2OALkuYWeGUl-pfqJEeOBxOSE";
const youtubeKey = "AIzaSyBbmhBBE4f-zLVG5c2cHVi4nzW_IBKDrA0";

const videoOpts = {
    maxResults: 5,
    type: "video",
    key: youtubeKey
};

module.exports = {
    name: "play",
    aliases: ["p", "music"],
    category: "music",
    description: "Plays music in the current channel.",
    usage: "play <youtube link | search phrase>",
    run: async (client, message, args) => {
        // No link provided
        if (!args[0]) {
            return message.reply("Please enter a Youtube link to play or search phrase.")
                .then(m => m.delete(5000));
        }

        var serverQueue = client.musicGuilds.get(message.guild.id);

        // Not in a voice channel
        if (!message.member.voiceChannel) {
            return message.reply("You must be in a voice channel!")
                .then(m => m.delete(5000));
        }

        // No bot permission
        if (!message.guild.me.hasPermission("CONNECT") || !message.guild.me.hasPermission("SPEAK")) {
            return message.reply("I need permission to join and speak in that channel!")
                .then(m => m.delete(5000));
        }

        // Check if playlist
        let playlistId = /(?<=list=).*(?=&?)/.exec(args[0]);
        if (playlistId) {
            playlistId = playlistId[0];
            let results = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems?" + "part=contentDetails%2Csnippet" + "&maxResults=50" + "&playlistId=" + playlistId + "&key=" + youtubeKey);
            if (results.data.items.length != 0) {
                for (videoInfo of results.data.items) {
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

        var songInfo;
        if (!ytdl.validateURL(args[0])) {
            let { results, pageInfo } = await search(args.join(" "), videoOpts);

            let videos = "";
            let videoDetailsList = [];
            for (i = 0; i < results.length; i++) {
                let videoDurationString = await getVideoDuration(results[i].id);

                videos = videos + `**${i + 1}:** ${results[i].title} **(${videoDurationString})**\n`;

                const videoInfo = {
                    title: results[i].title,
                    videoId: results[i].id,
                    videoDuration: videoDurationString
                };
                videoDetailsList.push(videoInfo);
            }
            const embedMsg = new RichEmbed()
                .setDescription(stripIndents`Type \`1-5\` for the video result you want to play, or anything else to cancel`)
                .addField("Results", videos);
            // Get user choice
            const choice = await message.reply(embedMsg).then(async msg => {
                let response = await waitResponse(msg, message.author, 30);

                // If they didn't respond back in time
                if (!response) {
                    msg.delete();
                    msg.channel.send("Cancelling play request...");
                    return;
                }

                // Check user choice
                switch (response.content) {
                    case "1":
                    case "2":
                    case "3":
                    case "4":
                    case "5":
                        //songInfo = await ytdl.getInfo(results[parseInt(response.content) - 1].link);
                        songInfo = videoDetailsList[parseInt(response.content) - 1];
                        songInfo.title = songInfo.title;
                        songInfo.video_url = "https://www.youtube.com/watch?v=" + songInfo.videoId;
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

        if (!songInfo) { // User entered a regular video link
            songInfo = await ytdl.getInfo(args[0]);
        }
        const song = {
            title: songInfo.title,
            url: songInfo.video_url,
        };
        queueSong(client, message, song);
        serverQueue = client.musicGuilds.get(message.guild.id);
        return message.channel.send(`**${song.title}** has been added to the queue! There are currently **${serverQueue.songs.length}** songs in queue.`);
    }
}

async function createQueue(client, message, song) {
    // Create queue struct
    const queueConstruct = {
        textChannel: message.channel,
        voiceChannel: message.member.voiceChannel,
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
        let connection = await queueConstruct.voiceChannel.join();
        queueConstruct.connection = connection;
        play(client, message.guild.id);
    }
    catch (err) {
        console.log(err);
        client.musicGuilds.delete(message.guild.id);
        return message.channel.send(err);
    }
}

function play(client, guild) {
    const serverQueue = client.musicGuilds.get(guild);
    const song = serverQueue.songs[0];

    // No more songs left in queue
    if (!song) {
        serverQueue.voiceChannel.leave();
        client.musicGuilds.delete(guild);
        return serverQueue.textChannel.send("Queue empty, leaving now.");
    }

    // Create dispatcher to play song
    const dispatcher = serverQueue.connection.playStream(ytdl(song.url,
        {
            filter: "audioonly",
            highWaterMark: 1 << 25
        }))
        .on("end", () => {
            if (!serverQueue.repeat) serverQueue.songs.shift();
            play(client, guild);
        })
        .on("error", () => {
            console.log(error);
        });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
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
    let videoDetails = await axios.get("https://www.googleapis.com/youtube/v3/videos?" + "part=contentDetails" + "&id=" + videoId + "&key=" + youtubeKey);
    let videoDurationRaw = videoDetails.data.items[0].contentDetails.duration;

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