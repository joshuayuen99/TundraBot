import { Command, CommandContext } from "../../base/Command";
import {
    MessageEmbed,
    Permissions,
    PermissionString,
    VoiceChannel
} from "discord.js";
import { VoiceConnection } from "@discordjs/voice";
import { sendReply } from "../../utils/functions";
import { stripIndents } from "common-tags";
import { DBSoundEffect, soundEffectInterface } from "../../models/SoundEffect";
import Deps from "../../utils/deps";
import defaults from "../../config";
import Logger from "../../utils/logger";
import { DBMember } from "../../models/Member";
import { QueryType } from "discord-player";

export interface SoundboardQueue {
    voiceChannel: VoiceChannel;
    connection: VoiceConnection;
    effects: soundEffectInterface[];
    volume: number;
    playing: boolean;
}

export default class Soundboard implements Command {
    name = "soundboard";
    aliases = ["sb"];
    category = "music";
    description =
        "Plays a soundboard effect in the current channel. For more details on how to add an effect, use `soundboard add`.";
    usage = stripIndents`soundboard
    soundboard play <effect name>
    soundboard add <effect name> <link | file attachment>
    soundboard delete <effect name>
    soundboard rename <effect name> <new effect name>
    soundboard join [effect name | remove]
    soundboard leave [effect name | remove]
    soundboard list`;
    examples = [
        "soundboard",
        "soundboard play RickRoll",
        "soundboard add RickRoll https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "soundboard delete RickRoll",
        "soundboard rename RickRoll NotRickRoll",
        "soundboard join RickRoll",
        "soundboard leave RickRoll",
    ];
    enabled = true;
    slashCommandEnabled = false;
    guildOnly = true;
    botPermissions: PermissionString[] = ["CONNECT", "SPEAK"];
    memberPermissions = [];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 3000; // 3 seconds

    DBSoundEffectManager: DBSoundEffect;
    DBMemberManager: DBMember;
    constructor() {
        this.DBSoundEffectManager = Deps.get<DBSoundEffect>(DBSoundEffect);
        this.DBMemberManager = Deps.get<DBMember>(DBMember);
    }

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        if (!args[0] || args.includes("list")) {
            // no arguments default
            this.listEffects(ctx, args);
        } else if (
            !ctx.member.roles.cache.some(
                (role) => role.id === ctx.guildSettings.soundboardRoleID
            ) &&
            !ctx.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)
        ) {
            // The server doesn't have the soundboardRole
            if (
                !ctx.guild.roles.cache.some(
                    (role) => role.id === ctx.guildSettings.soundboardRoleID
                )
            ) {
                sendReply(
                    ctx.client,
                    `Sorry, you need the \`${defaults.defaultGuildSettings.soundboardRole}\` role or \`MANAGE_GUILD\` permission to use most soundboard commands, and I couldn't find that in this server. Contact your server administrators to make the role, or change my config with the \`${ctx.guildSettings.prefix}config\` command.`,
                    ctx.msg
                );

                return;
            } else {
                const formattedRole = ctx.guild.roles.cache.find(
                    (role) => role.id === ctx.guildSettings.soundboardRoleID
                );

                sendReply(
                    ctx.client,
                    `Sorry, you need the ${formattedRole} role or \`MANAGE_GUILD\` permission to use most soundboard commands.`,
                    ctx.msg
                );

                return;
            }
        } else if (args.includes("play")) {
            this.playEffectCommand(ctx, args);
        } else if (args.includes("add")) {
            this.addEffect(ctx, args);
        } else if (args.includes("delete")) {
            this.deleteEffect(ctx, args);
        } else if (args.includes("rename")) {
            this.renameEffect(ctx, args);
        } else if (args.includes("join")) {
            this.setJoinEffect(ctx, args);
        } else if (args.includes("leave")) {
            this.setLeaveEffect(ctx, args);
        } else {
            sendReply(
                ctx.client,
                `Sorry, I couldn't understand that. \`${ctx.guildSettings.prefix}help soundboard\` for more info.`,
                ctx.msg
            );
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async listEffects(ctx: CommandContext, args: string[]): Promise<void> {
        const soundEffects =
            await this.DBSoundEffectManager.getGuildSoundEffects(ctx.guild);

        for (const soundEffect of soundEffects) {
            // Add soundEffects to databaseCache
            if (
                !ctx.client.databaseCache.soundEffects.has(
                    `${ctx.guild.id}${soundEffect.name}`
                )
            ) {
                ctx.client.databaseCache.soundEffects.set(
                    `${ctx.guild.id}${soundEffect.name}`,
                    soundEffect
                );
            }
        }

        const soundEffectsEmbed = new MessageEmbed();

        if (soundEffects.length === 0) {
            soundEffectsEmbed
                .setColor("RED")
                .setTitle("No sound effects available")
                .setDescription(
                    `No sound effects available for this server! Use \`${ctx.guildSettings.prefix}soundboard add\` to add a sound effect!`
                );
        } else {
            let soundEffectsString = soundEffects
                .map((soundEffect) => `[${soundEffect.name}](${soundEffect.link})`)
                .join(" ");

            const memberSoundEffects =
                ctx.client.databaseCache.memberSoundEffects.get(
                    `${ctx.guild.id}${ctx.author.id}`
                );

            soundEffectsString += "\n\n**Current user settings:**";
            if (memberSoundEffects) {
                soundEffectsString += "\nJoin sound effect: ";
                if (memberSoundEffects.joinSoundEffect) {
                    soundEffectsString += `\`${memberSoundEffects.joinSoundEffect.name}\``;
                } else {
                    soundEffectsString += "`None`";
                }

                soundEffectsString += "\nLeave sound effect: ";
                if (memberSoundEffects.leaveSoundEffect) {
                    soundEffectsString += `\`${memberSoundEffects.leaveSoundEffect.name}\``;
                } else {
                    soundEffectsString += "`None`";
                }
            } else {
                soundEffectsString +=
                    "\nJoin sound effect: `None`\nLeave sound effect: `None`";
            }

            soundEffectsEmbed
                .setColor("BLUE")
                .setTitle("Sound Effects Available")
                .setDescription(soundEffectsString)
                .setFooter(
                    `${ctx.guildSettings.prefix}soundboard play <effect name> to play a sound effect!`, ctx.author.displayAvatarURL()
                );
        }

        sendReply(ctx.client, { embeds: [soundEffectsEmbed] }, ctx.msg);
    }

    async playEffectCommand(
        ctx: CommandContext,
        args: string[]
    ): Promise<void> {
        const effectName = args[args.indexOf("play") + 1];

        if (!effectName) {
            sendReply(
                ctx.client,
                "Usage: `soundboard play <effect name>`",
                ctx.msg
            );
            return;
        }

        // Not in a voice channel
        const voice = ctx.member.voice.channel;
        if (!voice) {
            sendReply(ctx.client, "You must be connected to a voice channel!", ctx.msg);
            return;
        }

        // Check bot permissions
        const perms = voice.permissionsFor(ctx.client.user);
        if (!perms.has(Permissions.FLAGS.VIEW_CHANNEL)) {
            sendReply(ctx.client, "I need permission to view your voice channel!", ctx.msg);
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

        const soundEffect = await this.DBSoundEffectManager.getNoCreate({
            name: effectName,
            guildID: ctx.guild.id,
        });
        if (!soundEffect) {
            sendReply(
                ctx.client,
                `I couldn't find any sound effects with the name \`${effectName}\``,
                ctx.msg
            );
            return;
        }

        const queue = ctx.client.player.createQueue(ctx.guild, { metadata: ctx.channel });

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

        const searchResult = await ctx.client.player.search(soundEffect.link, {
            requestedBy: ctx.author,
            searchEngine: QueryType.AUTO,
        });

        if (!searchResult || searchResult.tracks.length === 0) {
            sendReply(
                ctx.client,
                `I had trouble playing [${soundEffect.name}](${soundEffect.link})... maybe it got deleted?`,
                ctx.msg
            );
            return;
        }

        queue.addTrack(searchResult.tracks[0]);
        
        if (!queue.playing) await queue.play();
    }

    async addEffect(ctx: CommandContext, args: string[]): Promise<void> {
        const effectName = args[args.indexOf("add") + 1];
        let link = args[args.indexOf("add") + 2];

        if (!effectName) {
            sendReply(
                ctx.client,
                `Please provide a name for the effect and either a link to the sound effect, or upload the file directly with the command (upload the file and type \`${ctx.guildSettings.prefix}soundboard add <effect name>\` as the comment).`,
                ctx.msg
            );
            return;
        } else if (!link) {
            // check uploaded file
            if (ctx.msg.attachments.size === 0) {
                // no link or sound effect attachment
                sendReply(
                    ctx.client,
                    `Please provide a link to the sound effect, or upload the file directly with the command (upload the file and type \`${ctx.guildSettings.prefix}soundboard add <effect name>\` as the comment).`,
                    ctx.msg
                );
                return;
            } else {
                // file was uploaded as an attachment
                link = ctx.msg.attachments.first().url;
            }
        }

        const soundEffect = {
            name: effectName,
            link: link,
            guildID: ctx.guild.id,
        } as soundEffectInterface;

        const dbSoundEffect = await this.DBSoundEffectManager.getNoCreate(
            soundEffect
        );

        // sound effect in the guild with that name already exists
        if (dbSoundEffect) {
            sendReply(
                ctx.client,
                "A sound effect with that name already exists in this server!",
                ctx.msg
            );
            return;
        }

        this.DBSoundEffectManager.create(soundEffect)
            .then(() => {
                sendReply(
                    ctx.client,
                    `Successfully saved sound effect as \`${soundEffect.name}\`!`,
                    ctx.msg
                );
                return;
            })
            .catch((err) => {
                Logger.log("error", `Error creating new sound effect:\n${err}`);
            });
    }

    async deleteEffect(ctx: CommandContext, args: string[]): Promise<void> {
        const effectName = args[args.indexOf("delete") + 1];

        if (!effectName) {
            sendReply(
                ctx.client,
                "Usage: `soundboard play <effect name>`",
                ctx.msg
            );
            return;
        }

        const soundEffect = await this.DBSoundEffectManager.getNoCreate({
            name: effectName,
            guildID: ctx.guild.id,
        });
        if (!soundEffect) {
            sendReply(
                ctx.client,
                `I couldn't find any sound effects with the name \`${effectName}\``,
                ctx.msg
            );
            return;
        }

        this.DBSoundEffectManager.delete(soundEffect)
            .then(() => {
                sendReply(
                    ctx.client,
                    `Successfully deleted \`${effectName}\`!`,
                    ctx.msg
                );
                return;
            })
            .catch((err) => {
                Logger.log("error", `Error deleting sound effect from database:\n${err}`);
                sendReply(
                    ctx.client,
                    "There was an error deleting the sound effect. This has been reported to my developer.",
                    ctx.msg
                );
                return;
            });
    }

    async renameEffect(ctx: CommandContext, args: string[]): Promise<void> {
        const effectName = args[args.indexOf("rename") + 1];
        const newEffectName = args[args.indexOf("rename") + 2];

        if (!effectName || !newEffectName) {
            sendReply(
                ctx.client,
                "Format: `soundboard rename <effect name> <new effect name>`",
                ctx.msg
            );
            return;
        }

        const oldSoundEffect = await this.DBSoundEffectManager.getNoCreate({
            name: effectName,
            guildID: ctx.guild.id,
        });

        if (!oldSoundEffect) {
            sendReply(
                ctx.client,
                `I couldn't find any sound effects with the name \`${effectName}\``,
                ctx.msg
            );
            return;
        }

        const newSoundEffect = await this.DBSoundEffectManager.getNoCreate({
            name: newEffectName,
            guildID: ctx.guild.id,
        });

        if (newSoundEffect) {
            sendReply(
                ctx.client,
                `A sound effect with the name \`${newEffectName}\` already exists in this server!`,
                ctx.msg
            );
            return;
        }

        oldSoundEffect.name = newEffectName;
        await this.DBSoundEffectManager.save(oldSoundEffect)
            .then(() => {
                sendReply(
                    ctx.client,
                    `Successfully renamed \`${effectName}\` to \`${newEffectName}\`!`,
                    ctx.msg
                );
                return;
            })
            .catch((err) => {
                Logger.log(
                    "error",
                    `Error renaming sound effect in database:\n${err}`
                );
                sendReply(
                    ctx.client,
                    "There was an error deleting the sound effect. This has been reported to my developer.",
                    ctx.msg
                );
                return;
            });

        return;
    }

    async setJoinEffect(ctx: CommandContext, args: string[]): Promise<void> {
        const effectName = args[args.indexOf("join") + 1];

        if (!effectName) {
            const soundEffects =
                ctx.client.databaseCache.memberSoundEffects.get(
                    `${ctx.guild.id}${ctx.author.id}`
                );
            if (!soundEffects || !soundEffects.joinSoundEffect) {
                sendReply(
                    ctx.client,
                    "Currently nothing will be played when you join a voice channel in this server.",
                    ctx.msg
                );
            } else {
                sendReply(
                    ctx.client,
                    `Will currently play \`${soundEffects.joinSoundEffect.name}\` when you join a voice channel in this server.`,
                    ctx.msg
                );
            }
            return;
        }

        // Removing sound effect from member
        if (effectName == "remove" || effectName == "delete") {
            // Save to database
            await this.DBMemberManager.updateJoinEffect(ctx.member, null).then(
                () => {
                    sendReply(
                        ctx.client,
                        "Success! Nothing will play when you join a voice channel in this server anymore!",
                        ctx.msg
                    );
                }
            );

            return;
        }

        // Get sound effect from database
        const savedSoundEffect = await this.DBSoundEffectManager.getNoCreate({
            name: effectName,
            guildID: ctx.guild.id,
        });

        // No sound effect with that name
        if (!savedSoundEffect) {
            sendReply(
                ctx.client,
                `I couldn't find any sound effects with the name \`${effectName}\``,
                ctx.msg
            );
            return;
        }

        // Save to database
        await this.DBMemberManager.updateJoinEffect(
            ctx.member,
            savedSoundEffect
        ).then(() => {
            sendReply(
                ctx.client,
                `Success! \`${effectName}\` will now play when you join a voice channel in this server!`,
                ctx.msg
            );
        });

        return;
    }

    async setLeaveEffect(ctx: CommandContext, args: string[]): Promise<void> {
        const effectName = args[args.indexOf("leave") + 1];

        if (!effectName) {
            const soundEffects =
                ctx.client.databaseCache.memberSoundEffects.get(
                    `${ctx.guild.id}${ctx.author.id}`
                );
            if (!soundEffects || !soundEffects.leaveSoundEffect) {
                sendReply(
                    ctx.client,
                    "Currently nothing will be played when you leave a voice channel in this server.",
                    ctx.msg
                );
            } else {
                sendReply(
                    ctx.client,
                    `Will currently play \`${soundEffects.leaveSoundEffect.name}\` when you leave a voice channel in this server.`,
                    ctx.msg
                );
            }
            return;
        }

        // Removing sound effect from member
        if (effectName == "remove" || effectName == "delete") {
            // Save to database
            await this.DBMemberManager.updateLeaveEffect(ctx.member, null).then(
                () => {
                    sendReply(
                        ctx.client,
                        "Success! Nothing will play when you leave a voice channel in this server anymore!",
                        ctx.msg
                    );
                }
            );

            return;
        }

        // Get sound effect from database
        const savedSoundEffect = await this.DBSoundEffectManager.getNoCreate({
            name: effectName,
            guildID: ctx.guild.id,
        });

        // No sound effect with that name
        if (!savedSoundEffect) {
            sendReply(
                ctx.client,
                `I couldn't find any sound effects with the name \`${effectName}\``,
                ctx.msg
            );
            return;
        }

        // Save to database
        await this.DBMemberManager.updateLeaveEffect(
            ctx.member,
            savedSoundEffect
        ).then(() => {
            sendReply(
                ctx.client,
                `Success! \`${effectName}\` will now play when you leave a voice channel in this server!`,
                ctx.msg
            );
        });

        return;
    }
}
