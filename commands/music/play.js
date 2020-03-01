const { RichEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");
const ytdl = require("ytdl-core");
const { waitResponse, shuffle } = require("../../functions");
const search = require('youtube-search');

const opts = {
    maxResults: 5,
    key: "AIzaSyCssZkseV2OALkuYWeGUl-pfqJEeOBxOSE"
};

module.exports = {
    name: "play",
    aliases: ["p", "music"],
    category: "music",
    description: "Plays music in the current channel.",
    usage: "play <youtube link>",
    run: async (client, message, args) => {
        // No link provided
        if(!args[0]) {
            return message.reply("Please enter a Youtube link to play.")
                .then(m => m.delete(5000));
        }

        const serverQueue = client.musicGuilds.get(message.guild.id);

        // Not in a voice channel
        if(!message.member.voiceChannel) {
            return message.reply("You must be in a voice channel!")
                .then(m => m.delete(5000));
        }

        // No bot permission
        if(!message.guild.me.hasPermission("CONNECT") || !message.guild.me.hasPermission("SPEAK")) {
            return message.reply("I need permission to join and speak in that channel!")
                .then(m => m.delete(5000));
        }

        var songInfo;
        if(!ytdl.validateURL(args[0])) {
            let {results, pageInfo} = await search(args.join(" "), opts);

            let videos = "";
            for(i = 0; i < results.length; i++) {
                videos = videos.concat(`**${i + 1}:** ${results[i].title}\n`);
            }
            const embedMsg = new RichEmbed()
                .setDescription(stripIndents`Type 1-5 for the video result you want to play, or anything else to cancel`)
                .addField("Results", videos);
            // Get user choice
            const choice = await message.reply(embedMsg).then(async msg => {
                let response = await waitResponse(msg, message.author, 30);
                
                // If they didn't respond back in time
                if(!response) {
                    msg.edit("Cancelling play request...");
                    return;
                }

                // Check user choice
                switch(response.content) {
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                    songInfo = await ytdl.getInfo(results[parseInt(response.content) - 1].link);
                    msg.edit(`Adding "${songInfo.title}" to the queue`);
                    return response;
                default:
                    msg.edit("Cancelling play request...");
                    return;
                }
            });
            // If they didn't respond back correctly
            if(!choice) return;
        }
        if(!songInfo) songInfo = await ytdl.getInfo(args[0]);
        const song = {
            title: songInfo.title,
            url: songInfo.video_url
        };

        // If a queue does not already exist for the server
        if(!serverQueue) {
            createQueue(client, message, song);
        }
        else {
            serverQueue.songs.push(song);
            if(serverQueue.toggle) {
                const currentSong = serverQueue.songs.slice(0, 1);
                serverQueue.songs = currentSong.concat(shuffle(serverQueue.songs.slice(1)));
            }
            console.log(serverQueue.songs);
            return message.channel.send(`"${song.title}" has been added to the queue! There are currently ${serverQueue.songs.length} songs in queue.`);
        }
    }
}

async function createQueue(client, message, song) {
    // Create queue struct
    const queueConstruct = {
        textChannel: message.channel,
        voiceChannel: message.member.voiceChannel,
        connection: null,
        songs: [],
        volume: 3,
        playing: true,
        shuffle: false
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
    if(!song) {
        serverQueue.voiceChannel.leave();
        client.musicGuilds.delete(guild);
        return serverQueue.textChannel.send("Queue empty, leaving now.");
    }

    // Create dispatcher to play song
    const dispatcher = serverQueue.connection.playStream(ytdl(song.url,
                                                        { quality: "highestaudio",
                                                        filter: "audioonly",
                                                        highWaterMark: 1<<25}))
        .on("end", () => {
            if(!serverQueue.repeat) serverQueue.songs.shift();
            play(client, guild);
        })
        .on("error", () => {
            console.log(error);
        });
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}