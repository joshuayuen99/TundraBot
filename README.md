[![Build Status](https://travis-ci.com/joshuayuen99/TundraBot.svg?token=EpUAuzH5nzhMPCzTTrCx&branch=master)](https://travis-ci.com/joshuayuen99/TundraBot)

# TundraBot

A personal Discord bot made in my free time and used by me and my friends. I've been developing it in chunks ever since November 2019, and still plan to continue improving it and adding new features moving forward. Updated for Discord.js v13.

TundraBot features a [dashboard](https://tundrabot.xyz) for server admins and moderators for high levels of configuration and general stats about the server, with new features constantly being added!

![Dashboard Statistics](/images/message_stats.png)
![Dashboard General Configuration](/images/dashboard_general.png)

Main features include playing music, server moderation, organizing events and polls, configurable role menus, configurable soundboard effects, and general info commands about the server and its members.

[Check out my official website and dashboard!](https://tundrabot.xyz)

To add me to your server click [here](https://discord.com/api/oauth2/authorize?client_id=647196546492006423&permissions=259241012342&scope=bot%20applications.commands)!

# Table of Contents

<!--ts-->
- [TundraBot](#tundrabot)
- [Table of Contents](#table-of-contents)
- [Commands](#commands)
  - [Info](#info)
  - [Music](#music)
  - [Moderation](#moderation)
  - [Utility](#utility)
  - [Fun](#fun)
- [Self-hosting](#self-hosting)
- [Contributing](#contributing)

<!--te-->

# Commands

For a full list of commands visit [my commands page](https://tundrabot.xyz/commands)!

`<>`s in commands indicate required arguments.

`[]`s in commands indicate optional arguments.

`|`s in either `<>`s or `[]`s indicate that any of the choices will work.

`mention` indicates an @someone format (eg. @TundraBot).

`username` indicates someone's display name in a server (eg. TundraBot).

`id` indicates the unique id associated with each Discord account. Generally hidden from users unless retrieved via a bot command.

## Info

- `Help [command | alias]` Displays a list of all commands, or detailed info about the provided command (can provide command aliases as well).
- `Whois [username | id | mention]` Displays user information such as the date someone joined the server, their roles, and when they created their account. If a user is not given, it will display user information about the person who used this command.
- `Oldest <member | user | account>` Returns information about the oldest member (server member) or user (account) of the server. When considering the oldest member of the server, it disregards the original creator of the server as they will always be the oldest except for when ownership is transferred.
- `Serverinfo` Displays information about the server such as the date it was created and how many people are currently in the server.
- `Botinfo` Displays basic information about the bot.
- `Ping` Gives you the delay between sending this command and getting a response as well as the current API latency.

## Music

My bot can play music or other YouTube links directly through Discord via a voice channel in a server. It's able to serve multiple servers at the same time such that music playing in one server has no effect on music playing in another server. I've also implemented a dynamic queuing system so that you can not only add new songs to the queue while music is already playing, but you can also shuffle, pause, and skip songs at any point as well.

Soundboard commands are locked behind a configurable role (`config` command) to prevent just anyone from using them. The soundboard is customizable and you can add or remove any sound effects you wish from your server. These sound effects can be played at will with the `Soundboard play` command, or even set specific sound effects to be played when a specific user joins and/or leaves a voice channel!

- `Play <YouTube link | search phrase>` Plays music from YouTube! Accepts either a YouTube link (playlists included) or a search phrase. If given a search phrase, it will search YouTube directly and give you the option to choose from the top 5 results.
- `Soundboard [list]` Lists all the soundboard effects available in the server.
- `Soundboard play <effect name>` Plays the given sound effect in the user's voice channel.
- `Soundboard add <effect name> <link | file attachment>` Adds the given sound effect to the server. It works with direct links to audio/video files (eg. www.example.com/soundeffect.mp3), YouTube links, and even lets you directly upload files for it to use. To upload a file, you must send `Soundboard add <effect name>` as the comment sent alongside the file.
- `Soundboard delete <effect name>` Deletes the given sound effect from the server.
- `Soundboard rename <effect name> <new effect name>` Renames the given sound effect.
- `Soundboard join <effect name>` Sets a sound effect to be played whenever the user joins a voice channel.
- `Soundboard leave <effect name>` Sets a sound effect to be played whenever the user leaves a voice channel.
- `Skip` Skips the currently playing song and moves on to the next one in queue.
- `Stop` Stops playing music, clears the queue of songs, and leaves the voice channel.
- `Playing` Displays and links the currently playing song.
- `Queue` Displays the next 5 songs to be played in queue.
- `Repeat` Sets the currently playing song to repeat after it's done. Can be toggled on or off.
- `Shuffle [toggle | t]` Shuffles the current queue of songs once. If provided the [toggle] or [t] option, it toggles the queue to be shuffled every time a new song is added to the queue.
- `Pause` Pauses the currently playing song.
- `Resume` Resumes the currently paused song.
- `Restart` Restarts the currently playing song immediately.

## Moderation
My bot will automatically log whenever someone joins and leaves the server, along with when they first joined. Alongside this feature, my bot will provide logs for server admins whenever commands such as `ban`, `kick`, and `mute` are used, including information such as who issued the command and for what reason. These logs will be posted in a private admin channel that will be created automatically if it doesn't already exist. It will default to disallowing the @everyone role from being able to read it, thus allowing only members with Administrator permission to see it.

- `Undelete [all | id | mention] [-c channel] [-n number of messages]` Displays the user's last `n` (default 10) deleted messages in the server, or the specified channel if one was given. The `all`, `id`, and `mention` options can only be used by members with the `Manage Messages` permission and will display the last `n` deleted messages of the specified member(s) in the server/specified channel.
- `Unedit [all | id | mention] [-c channel] [-n number of messages]` Displays the history of the user's last `n` (default 10) edited messages in the server, or the specified channel. The `all`, `id`, and `mention` options can only be used by members with the `Manage Messages` permission and will display the history of the last `n` edited messages of the specified member(s) in the server/specified channel.
- `Ban <mention | id> <reason>` Bans a member of the server and logs the reason to the admins.
- `Kick <mention | id> <reason>` Kicks a member of the server and logs the reason to the admins.
- `Mute <mention | id> <time (#s/m/h)>` Mutes a member of the server for the given amount of time, preventing them from typing in text channels and from talking in voice channels.
- `Report <mention | id> <reason>` Reports a member of the server to the admins, without letting everyone else in the server see what the reason was.
- `Suggest <suggestion>` Suggests a feature or other form of input to me! My bot will forward me your suggestion via DM.

## Utility

- `Event` Creates an interactive event that members of the server can sign up for, just provide the date and time! It gets updated in real-time whenever someone signs up for it, and automatically DM's each participant when the event starts. It allows you to set a limit for how many people can sign up, and keeps track of a waitlist of who is next in line in case someone drops out.

    ![Event](/images/scheduled_event.png)

- `Poll` Creates a poll that members of the server can respond to! Input is given by reacting to the poll with emojis that the poll creator specifies (👍 and 👎 for example). The creator just needs to provide how long the poll should last and when the time comes, the poll will be automatically updated to show what the final results were. Each participant in the poll will also be DM'd with the final results.

- `Rolemenu` Creates a role menu that members of the server can simply react to in order to get roles! Allows for editing/updating the role menu by adding or removing roles on the fly without needing to create an entire new one. Useful uses for this could be allowing members to assign name colors to themselves, or to assign roles for games that they're interested in getting @'d for.

    ![Color role Menu](/images/role_menu_colors.png)
    ![Games role Menu](/images/role_menu_games.png)

- `RNG [min max]` Randomly picks a number between [min] and [max] if provided, or 0-100 otherwise.
- `Emoji <emoji> [...emoji]` Gives the unicode for the entered emoji(s).

## Fun

- `Akinator` Play a game of Akinator!
- `RPS (rock paper scissors)` Play a game of rock paper scissors against the bot. Choose your move by reacting to the bot's response message.
- `Love [mention | id | username]` Displays how much love a given person has for you (just a random fun command). If a user is not given, it randomly chooses someone else in the server.

# Self-hosting

If you'd like to self-host TundraBot, check out the [installation guide](INSTALL.md).

# Contributing

Contributions of any kind are welcome! Please feel free to contact me on Discord (TundraBuddy#4650) or submit them to the repository via pull requests.
