import {
    Command,
    CommandContext,
    SlashCommandContext,
} from "../../base/Command";
import {
    ApplicationCommandOption,
    CollectorFilter,
    Message,
    MessageActionRow,
    MessageEmbed,
    MessageSelectMenu,
    MessageSelectOptionData,
    PermissionResolvable,
    Permissions,
    SelectMenuInteraction,
} from "discord.js";
import { sendReply } from "../../utils/functions";
import { QueryType } from "discord-player";

export default class Play implements Command {
    name = "play";
    aliases = ["p", "music"];
    category = "music";
    description =
        "Plays music in the current channel. Currently supports YouTube, Spotify, and SoundCloud links.";
    usage = "play <link | search phrase>";
    examples = [
        "play https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "play https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=08e1adc6617f4019",
        "play https://soundcloud.com/rick-astley-official/never-gonna-give-you-up",
        "play never gonna give you up",
    ];
    enabled = true;
    slashCommandEnabled = true;
    guildOnly = true;
    botPermissions: PermissionResolvable[] = [
        Permissions.FLAGS.CONNECT,
        Permissions.FLAGS.SPEAK,
    ];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds
    slashDescription = "Plays music in the current channel";
    commandOptions: ApplicationCommandOption[] = [
        {
            name: "input",
            type: "STRING",
            description: "The link or search phrase to play",
            required: true,
        },
    ];

    ytdlOptions = {
        filter: "audioonly",
        fmt: "mp3",
        highWaterMark: 1 << 62,
        liveBuffer: 1 << 62,
        dlChunkSize: 0, // disabling chunking is recommended for a Discord bot
        bitrate: 128,
        quality: "lowestaudio",
    };

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const song = args.join(" ");
        if (!song) {
            sendReply(ctx.client, "Missing link or song name.", ctx.msg);
            return;
        }

        // Make sure user is in a voice channel
        const voice = ctx.member.voice.channel;
        if (!voice) {
            sendReply(
                ctx.client,
                "You must be connected to a voice channel!",
                ctx.msg
            );
            return;
        }

        // Check bot permissions
        const perms = voice.permissionsFor(ctx.client.user);
        if (!perms.has(Permissions.FLAGS.VIEW_CHANNEL)) {
            sendReply(
                ctx.client,
                "I need permission to view your voice channel!",
                ctx.msg
            );
            return;
        }
        if (!perms.has(Permissions.FLAGS.CONNECT)) {
            sendReply(
                ctx.client,
                "I need permission to join your voice channel!",
                ctx.msg
            );
            return;
        }
        if (!perms.has(Permissions.FLAGS.SPEAK)) {
            sendReply(
                ctx.client,
                "I need permission to speak in your voice channel!",
                ctx.msg
            );
            return;
        }

        const searchResult = await ctx.client.player.search(song, {
            requestedBy: ctx.author,
            searchEngine: QueryType.AUTO,
        });

        if (!searchResult || searchResult.tracks.length === 0) {
            sendReply(
                ctx.client,
                `No results were found for \`${song}\`!`,
                ctx.msg
            );
            return;
        }

        let trackToPlay: number;
        if (!searchResult.playlist && searchResult.tracks.length > 1) {
            const selectMenuOptions = searchResult.tracks.map(
                (track, index) =>
                    ({
                        label: track.title.slice(0, 100),
                        description: `${track.author} | [${track.duration}]`,
                        value: index.toString(),
                    } as MessageSelectOptionData)
            );

            const selectMenuEmbed = new MessageEmbed()
                .setColor("BLUE")
                .setDescription("Select which song to play below!")
                .setFooter("This choice becomes invalid after 60s");

            const row = new MessageActionRow().addComponents(
                new MessageSelectMenu()
                    .setCustomId("musicSelect")
                    .setPlaceholder("Nothing selected")
                    .addOptions(selectMenuOptions.slice(0, 10))
            );

            const messageSelectMenuMessage = (await sendReply(
                ctx.client,
                {
                    embeds: [selectMenuEmbed],
                    components: [row],
                },
                ctx.msg
            )) as Message;

            const filter: CollectorFilter<[SelectMenuInteraction]> = (i) => {
                const intendedUser = i.user.id === ctx.author.id;
                if (!intendedUser) {
                    i.reply({
                        content: "This select menu isn't for you!",
                        ephemeral: true,
                    });
                }

                return intendedUser;
            };

            let choice: SelectMenuInteraction;
            try {
                choice = await messageSelectMenuMessage.awaitMessageComponent({
                    filter,
                    componentType: "SELECT_MENU",
                    time: 60 * 1000,
                });
            } catch (err) {
                // No interactions were collected

                if (messageSelectMenuMessage && messageSelectMenuMessage.deletable)
                    messageSelectMenuMessage.delete();

                return;
            }

            if (messageSelectMenuMessage && messageSelectMenuMessage.deletable)
                messageSelectMenuMessage.delete();

            // play user option, or first choice if none selected
            trackToPlay = choice ? Number(choice.values[0]) : 0;
        } else {
            trackToPlay = 0;
        }

        const queue = ctx.client.player.createQueue(ctx.guild, {
            metadata: ctx.channel,
        });

        try {
            if (!queue.connection) await queue.connect(voice);
        } catch {
            ctx.client.player.deleteQueue(ctx.guild.id);
            sendReply(
                ctx.client,
                "I couldn't join your voice channel!",
                ctx.msg
            );
            return;
        }

        // Add one or more tracks to queue
        if (searchResult.playlist) {
            queue.addTracks(searchResult.tracks);

            const embedMsg = new MessageEmbed()
                .setColor("BLUE")
                .setDescription(
                    `\`${searchResult.tracks.length}\` songs have been added to the queue! There are currently \`${queue.tracks.length}\` songs in queue.`
                );

            sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
        } else {
            // single track
            const track = searchResult.tracks[trackToPlay];

            queue.addTrack(track);

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

            sendReply(ctx.client, { embeds: [embedMsg] }, ctx.msg);
        }

        // eslint-disable-next-line
        // @ts-ignore
        if (!queue.playing) await queue.play(undefined, { ytdlOptions: this.ytdlOptions });
    }

    async slashCommandExecute(ctx: SlashCommandContext): Promise<void> {
        const query = ctx.commandInteraction.options.getString("input");

        // Make sure user is in a voice channel
        const voice = ctx.member.voice.channel;
        if (!voice) {
            ctx.commandInteraction.reply({
                content: "You must be connected to a voice channel!",
                ephemeral: true,
            });
            return;
        }

        await ctx.commandInteraction.deferReply();

        // Check bot permissions
        const perms = voice.permissionsFor(ctx.client.user);
        if (!perms.has(Permissions.FLAGS.VIEW_CHANNEL)) {
            ctx.commandInteraction.editReply(
                "I need permission to view your voice channel!"
            );
            return;
        }
        if (!perms.has(Permissions.FLAGS.CONNECT)) {
            ctx.commandInteraction.editReply(
                "I need permission to join your voice channel!"
            );
            return;
        }
        if (!perms.has(Permissions.FLAGS.SPEAK)) {
            ctx.commandInteraction.editReply(
                "I need permission to speak in your voice channel!"
            );
            return;
        }

        const searchResult = await ctx.client.player.search(query, {
            requestedBy: ctx.author,
            searchEngine: QueryType.AUTO,
        });

        if (!searchResult || searchResult.tracks.length === 0) {
            ctx.commandInteraction.editReply(
                `No results were found for \`${query}\`!`
            );
            return;
        }

        let trackToPlay: number;
        if (!searchResult.playlist && searchResult.tracks.length > 1) {
            const selectMenuOptions = searchResult.tracks.map(
                (track, index) =>
                    ({
                        label: track.title.slice(0, 100),
                        description: `${track.author} | [${track.duration}]`,
                        value: index.toString(),
                    } as MessageSelectOptionData)
            );

            const selectMenuEmbed = new MessageEmbed()
                .setColor("BLUE")
                .setDescription("Select which song to play below!")
                .setFooter("This choice becomes invalid after 60s");

            const row = new MessageActionRow().addComponents(
                new MessageSelectMenu()
                    .setCustomId("musicSelect")
                    .setPlaceholder("Nothing selected")
                    .addOptions(selectMenuOptions.slice(0, 10))
            );

            const messageSelectMenuMessage =
                (await ctx.commandInteraction.editReply({
                    embeds: [selectMenuEmbed],
                    components: [row],
                })) as Message;

            const filter: CollectorFilter<[SelectMenuInteraction]> = (i) => {
                const intendedUser = i.user.id === ctx.author.id;
                if (!intendedUser) {
                    i.reply({
                        content: "This select menu isn't for you!",
                        ephemeral: true,
                    });
                }

                return intendedUser;
            };

            let choice: SelectMenuInteraction;
            try {
                choice = await messageSelectMenuMessage.awaitMessageComponent({
                    filter,
                    componentType: "SELECT_MENU",
                    time: 60 * 1000,
                });
            } catch (err) {
                // No interactions were collected
                if (messageSelectMenuMessage && messageSelectMenuMessage.deletable)
                    messageSelectMenuMessage.delete();

                return;
            }

            // play user option, or first choice if none selected
            trackToPlay = Number(choice.values[0]);
        } else {
            trackToPlay = 0;
        }

        await ctx.commandInteraction.editReply({
            content: `:stopwatch: | Loading your track${
                searchResult.playlist && searchResult.tracks.length > 1
                    ? "s"
                    : ""
            }...`,
            embeds: [],
            components: [],
        });

        const queue = ctx.client.player.createQueue(ctx.guild, {
            metadata: ctx.channel,
        });

        try {
            if (!queue.connection) await queue.connect(voice);
        } catch {
            ctx.client.player.deleteQueue(ctx.guild.id);
            ctx.commandInteraction.editReply({
                content: "I couldn't join your voice channel!",
                embeds: [],
                components: [],
            });
            return;
        }

        // Add one or more tracks to queue
        if (searchResult.playlist) {
            queue.addTracks(searchResult.tracks);

            const embedMsg = new MessageEmbed()
                .setColor("BLUE")
                .setDescription(
                    `\`${searchResult.tracks.length}\` songs have been added to the queue! There are currently \`${queue.tracks.length}\` songs in queue.`
                );

            ctx.commandInteraction.editReply({
                content: null,
                embeds: [embedMsg],
                components: [],
            });
        } else {
            // single track
            const track = searchResult.tracks[trackToPlay];

            queue.addTrack(track);

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

            ctx.commandInteraction.editReply({
                content: null,
                embeds: [embedMsg],
                components: [],
            });
        }

        // eslint-disable-next-line
        // @ts-ignore
        if (!queue.playing) await queue.play(undefined, { ytdlOptions: this.ytdlOptions });
    }
}
