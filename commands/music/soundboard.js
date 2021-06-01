const { stripIndents } = require("common-tags");
const { SoundEffect } = require("../../models");
const ytdl = require("ytdl-core");
const { MessageEmbed } = require("discord.js");
const { defaultGuildSettings } = require("../../config");

module.exports = {
    name: "soundboard",
    aliases: ["sb"],
    category: "music",
    description: "Plays a soundboard effect in the current channel. For more details on how to add an effect, use `soundboard add`.",
    usage: stripIndents`soundboard
    soundboard play <effect name>
    soundboard add <effect name> <link | file attachment>
    soundboard delete <effect name>
    soundboard rename <effect name> <new effect name>
    soundboard join [effect name | remove]
    soundboard leave [effect name | remove]
    soundboard list`,
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {import("discord.js").Message} message Discord Message object
     * @param {String[]} args command arguments
     * @param {Object} settings guild settings
    */
    run: async (client, message, args, settings) => {
        if (!args[0] || args.includes("list")) { // no arguments default
            listEffects(client, message, args, settings);
        } else if (!message.member.roles.cache.some(role => role.id === settings.soundboardRoleID) && !message.member.hasPermission("MANAGE_GUILD")) {
            // The server doesn't have the soundboardRole
            if (!message.guild.roles.cache.some(role => role.id === settings.soundboardRoleID)) {
                message.channel.send(`Sorry, you need the \`${defaultGuildSettings.soundboardRole}\` role or \`MANAGE_GUILD\` permission to use most soundboard commands, and I couldn't find that in this server. Contact your server administrators to make the role, or change my config with the \`${settings.prefix}config\` command.`);
                
                return;
            } else {
                const formattedRole = message.guild.roles.cache.find(role => role.id === settings.soundboardRoleID);
                message.channel.send(`Sorry, you need the ${formattedRole} role or \`MANAGE_GUILD\` permission to use most soundboard commands.`);

                return;
            }
        }
        else if (args.includes("play")) {
            playEffectCommand(client, message, args, settings);
        } else if (args.includes("add")) {
            addEffect(client, message, args, settings);
        } else if (args.includes("delete")) {
            deleteEffect(client, message, args, settings);
        } else if (args.includes("rename")) {
            renameEffect(client, message, args, settings);
        } else if (args.includes("join")) {
            setJoinEffect(client, message, args, settings);
        } else if (args.includes("leave")) {
            setLeaveEffect(client, message, args, settings);
        } else {
            message.channel.send(`Sorry, I couldn't understand that. \`${settings.prefix}help soundboard\` for more info.`);
        }
    },
    /**
     * @param {import("discord.js").Client} client Discord Client instance
     * @param {String} guildID guild ID
     * @param {import("discord.js").VoiceChannel} voiceChannel voice channel
     * @param {Document} effect sound effect to queue
    */
    queueEffect: async (client, guildID, voiceChannel, effect) => {
        const serverQueue = client.soundboardGuilds.get(guildID);
        // If a queue does not already exist for the server
        if (!serverQueue) {
            await createQueue(client, guildID, voiceChannel, effect);
        } else {
            serverQueue.effects.push(effect);
        }
    }
};

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").Message} message Discord Message object
 * @param {String[]} args command arguments
 * @param {Object} settings guild settings
*/
async function setJoinEffect(client, message, args, settings) {
    let effectName = args[args.indexOf("join") + 1];

    if (!effectName) {
        let soundEffects = client.databaseCache.memberSoundEffects.get(`${message.member.guild.id}${message.author.id}`);
        if (!soundEffects || !soundEffects.joinSoundEffect) {
            message.channel.send("Currently nothing will be played when you join a voice channel in this server.");
        } else {
            message.channel.send(`Will currently play \`${soundEffects.joinSoundEffect.name}\` when you join a voice channel in this server.`);
        }
        return;
    }

    let memberObject = await client.getMember(message.member);

    // Create new member in database
    if (!memberObject) {
        memberObject = await client.createMember(message.member);
    }

    // Removing sound effect from event
    if (effectName == "remove" || effectName == "delete") {
        // Save sound effect to database
        client.updateMember(message.member, {
            joinSoundEffect: null
        });

        let soundEffects = client.databaseCache.memberSoundEffects.get(`${message.member.guild.id}${message.author.id}`);

        // not in cache yet
        if (!soundEffects) {
            soundEffects = {
                joinSoundEffect: null,
                leaveSoundEffect: null
            };
        } else {
            soundEffects.joinSoundEffect = null;
        }
        // save to cache
        client.databaseCache.memberSoundEffects.set(`${message.member.guild.id}${message.author.id}`, soundEffects);

        message.channel.send(`Success! Nothing will play when you join a voice channel in this server anymore!`);
        
        return;
    }

    // Get sound effect from database
    let soundEffectObject = await SoundEffect.findOne({
        name: effectName,
        guildID: message.guild.id
    }).catch((err) => {
        console.error("Error getting sound effect from database: ", err);
    });

    // No sound effect with that name
    if (!soundEffectObject) {
        message.channel.send(`I couldn't find any sound effects with the name \`${effectName}\``);
        return;
    }

    // Save sound effect to database
    client.updateMember(message.member, {
        joinSoundEffect: soundEffectObject._id
    });

    let soundEffects = client.databaseCache.memberSoundEffects.get(`${message.member.guild.id}${message.author.id}`);

    // not in cache yet
    if (!soundEffects) {
        soundEffects = {
            joinSoundEffect: soundEffectObject,
            leaveSoundEffect: null
        };
    } else {
        soundEffects.joinSoundEffect = soundEffectObject;
    }
    // save to cache
    client.databaseCache.memberSoundEffects.set(`${message.member.guild.id}${message.author.id}`, soundEffects);

    message.channel.send(`Success! \`${effectName}\` will now play when you join a voice channel in this server!`);
}

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").Message} message Discord Message object
 * @param {String[]} args command arguments
 * @param {Object} settings guild settings
*/
async function setLeaveEffect(client, message, args, settings) {
    let effectName = args[args.indexOf("leave") + 1];

    if (!effectName) {
        let soundEffects = client.databaseCache.memberSoundEffects.get(`${message.member.guild.id}${message.author.id}`);
        if (!soundEffects || !soundEffects.leaveSoundEffect) {
            message.channel.send("Currently nothing will be played when you join a voice channel in this server.");
        } else {
            message.channel.send(`Will currently play \`${soundEffects.leaveSoundEffect.name}\` when you join a voice channel in this server.`);
        }
        return;
    }

    let memberObject = await client.getMember(message.member);

    // Create new member in database
    if (!memberObject) {
        memberObject = await client.createMember(message.member);
    }

    // Removing sound effect from event
    if (effectName == "remove" || effectName == "delete") {
        // Save sound effect to database
        client.updateMember(message.member, {
            joinSoundEffect: null
        });

        let soundEffects = client.databaseCache.memberSoundEffects.get(`${message.member.guild.id}${message.author.id}`);

        // not in cache yet
        if (!soundEffects) {
            soundEffects = {
                joinSoundEffect: null,
                leaveSoundEffect: null
            };
        } else {
            soundEffects.joinSoundEffect = null;
        }
        // save to cache
        client.databaseCache.memberSoundEffects.set(`${message.member.guild.id}${message.author.id}`, soundEffects);

        message.channel.send(`Success! Nothing will play when you join a voice channel in this server anymore!`);

        return;
    }

    // Get sound effect from database
    let soundEffectObject = await SoundEffect.findOne({
        name: effectName,
        guildID: message.guild.id
    }).catch((err) => {
        console.error("Error getting sound effect from database: ", err);
    });

    if (!soundEffectObject) {
        message.channel.send(`I couldn't find any sound effects with the name \`${effectName}\``);
        return;
    }

    // Save sound effect to database
    client.updateMember(message.member, {
        leaveSoundEffect: soundEffectObject._id
    });

    let soundEffects = client.databaseCache.memberSoundEffects.get(`${message.member.guild.id}${message.author.id}`);

    // not in cache yet
    if (!soundEffects) {
        soundEffects = {
            joinSoundEffect: null,
            leaveSoundEffect: soundEffectObject
        };
    } else {
        soundEffects.leaveSoundEffect = soundEffectObject;
    }

    // save to cache
    client.databaseCache.memberSoundEffects.set(`${message.member.guild.id}${message.author.id}`, soundEffects);

    message.channel.send(`Success! \`${effectName}\` will now play when you leave a voice channel in this server!`);
}

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").Message} message Discord Message object
 * @param {String[]} args command arguments
 * @param {Object} settings guild settings
*/
async function listEffects(client, message, args, settings) {
    let soundEffects = await SoundEffect.find({
        guildID: message.guild.id
    });

    let soundEffectsString = "";
    for (const soundEffect of soundEffects) {
        // Add soundEffects to databaseCache
        if (!client.databaseCache.soundEffects.has(`${message.guild.id}${soundEffect.name}`)) {
            client.databaseCache.soundEffects.set(`${message.guild.id}${soundEffect.name}`, soundEffect);
        }

        soundEffectsString += `\`${soundEffect.name}\` `;
    }

    const soundEffectsEmbed = new MessageEmbed();

    if (soundEffectsString == "") {
        soundEffectsEmbed
            .setColor("RED")
            .setTitle("No sound effects available")
            .setDescription(`No sound effects available for this server! Use \`${settings.prefix}soundboard add\` to add a sound effect!`);
    } else {
        soundEffectsString = soundEffectsString.slice(0, soundEffectsString.length - 1);

        let memberSoundEffects = client.databaseCache.memberSoundEffects.get(`${message.member.guild.id}${message.author.id}`);

        soundEffectsString += "\n\n**Current user settings:**";
        if (memberSoundEffects) {
            soundEffectsString += `\nJoin sound effect: `;
            if (memberSoundEffects.joinSoundEffect) {
                soundEffectsString += `\`${memberSoundEffects.joinSoundEffect.name}\``;
            } else {
                soundEffectsString += "`None`"
            }

            soundEffectsString += `\nLeave sound effect: `;
            if (memberSoundEffects.leaveSoundEffect) {
                soundEffectsString += `\`${memberSoundEffects.leaveSoundEffect.name}\``;
            } else {
                soundEffectsString += "`None`";
            }
        } else {
            soundEffectsString += `\nJoin sound effect: \`None\`\nLeave sound effect: \`None\``;
        }

        soundEffectsEmbed
            .setColor("BLUE")
            .setTitle("Sound Effects Available")
            .setDescription(soundEffectsString)
            .setFooter(`${settings.prefix}soundboard play <effect name> to play a sound effect!`);
    }

    message.channel.send(soundEffectsEmbed);
}

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").Message} message Discord Message object
 * @param {String[]} args command arguments
 * @param {Object} settings guild settings
*/
async function addEffect(client, message, args, settings) {
    let effectName = args[args.indexOf("add") + 1];
    let link = args[args.indexOf("add") + 2];

    if (effectName == undefined) {
        message.channel.send(`Please provide a name for the effect and either a link to the sound effect, or upload the file directly with the command (upload the file and type \`${settings.prefix}soundboard add <effect name>\` as the comment).`);
        return;
    } else if (link == undefined) { // check uploaded file
        if (message.attachments.size === 0) { // no link or sound effect attachment
            message.channel.send(`Please provide a link to the sound effect, or upload the file directly with the command (upload the file and type \`${settings.prefix}soundboard add <effect name>\` as the comment).`);
            return;
        } else { // file was uploaded as an attachment
            link = message.attachments.first().url;
        }
    }

    const soundEffect = {
        name: effectName,
        link: link,
        guildID: message.guild.id
    };

    const dbSoundEffect = await SoundEffect.findOne({
        name: soundEffect.name,
        guildID: soundEffect.guildID
    }).catch((err) => {
        console.error("Error finding sound effect from database: ", err);
    });

    // sound effect in the guild with that name already exists
    if (dbSoundEffect) {
        message.channel.send("A sound effect with that name already exists in this server!");
        return;
    }

    client.createSoundEffect(soundEffect);

    message.channel.send(`Successfully saved sound effect as \`${soundEffect.name}\`!`);
}

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").Message} message Discord Message object
 * @param {String[]} args command arguments
 * @param {Object} settings guild settings
*/
async function deleteEffect(client, message, args, settings) {
    let effectName = args[args.indexOf("delete") + 1];

    if (!effectName) {
        message.channel.send("Format: `soundboard delete <effect name>`");
        return;
    }

    const soundEffect = await SoundEffect.findOne({
        name: effectName,
        guildID: message.guild.id
    }).catch((err) => {
        console.error("Error finding sound effect from database: ", err);
    });

    if (!soundEffect) {
        message.channel.send(`I couldn't find any sound effects with the name \`${effectName}\``);
        return;
    }

    soundEffect.delete()
        .then(() => {
            client.databaseCache.soundEffects.delete(`${message.guild.id}${effectName}`);
            message.channel.send(`Successfully deleted \`${effectName}\`!`);
        }).catch((err) => {
            console.error("Error deleting sound effect from database: ", err);
            message.channel.send("There was an error deleting the sound effect. This has been reported to my developer.");
        });
}

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").Message} message Discord Message object
 * @param {String[]} args command arguments
 * @param {Object} settings guild settings
*/
async function renameEffect(client, message, args, settings) {
    let effectName = args[args.indexOf("rename") + 1];
    let newEffectName = args[args.indexOf("rename") + 2];

    if (!effectName || !newEffectName) {
        message.channel.send("Format: `soundboard rename <effect name> <new effect name>`");
        return;
    }

    const oldSoundEffect = await SoundEffect.findOne({
        name: effectName,
        guildID: message.guild.id
    }).catch((err) => {
        console.error("Error finding sound effect from database: ", err);
    });

    const newSoundEffect = await SoundEffect.findOne({
        name: newEffectName,
        guildID: message.guild.id
    }).catch((err) => {
        console.error("Error finding sound effect from database: ", err);
    });

    if (!oldSoundEffect) {
        message.channel.send(`I couldn't find any sound effects with the name \`${effectName}\``);
        return;
    } else if (newSoundEffect) {
        message.channel.send(`A sound effect with the name \`${newEffectName}\` already exists in this server!`);
        return;
    }

    // Save to database and update cache
    oldSoundEffect.name = newEffectName;
    oldSoundEffect.save()
        .then(() => {
            client.databaseCache.soundEffects.delete(`${message.guild.id}${effectName}`);
            client.databaseCache.soundEffects.set(`${message.guild.id}${newEffectName}`, oldSoundEffect);

            message.channel.send(`Successfully renamed \`${effectName}\` to \`${newEffectName}\`!`);
        }).catch((err) => {
            console.error("Error renaming sound effect in database: ", err);
            message.channel.send("There was an error saving the changes. This has been reported to my developer.");
        });

    return;
}

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {import("discord.js").Message} message Discord Message object
 * @param {String[]} args command arguments
 * @param {Object} settings guild settings
*/
async function playEffectCommand(client, message, args, settings) {
    let effectName = args[args.indexOf("play") + 1];

    if (!effectName) {
        message.channel.send("Format: `soundboard play <effect name>`");
        return;
    }

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

    /** @type {Document} */
    let soundEffect;
    if (client.databaseCache.soundEffects.has(`${message.guild.id}${effectName}`)) {
        soundEffect = client.databaseCache.soundEffects.get(`${message.guild.id}${effectName}`);
    } else {
        soundEffect = await SoundEffect.findOne({
            name: effectName,
            guildID: message.guild.id
        });

        // Sound effect doesn't exist
        if (!soundEffect) {
            message.channel.send(`I couldn't find any sound effects with the name \`${effectName}\``);
            return;
        }

        client.databaseCache.soundEffects.set(`${message.guild.id}${effectName}`, soundEffect);
    }

    await module.exports.queueEffect(client, message.guild.id, message.member.voice.channel, soundEffect).catch((err) => {
        console.log(err);
        message.channel.send(`There was an error playing this sound effect. If this issue persists, please contact my creator ${process.env.OWNERNAME}${process.env.OWNERTAG}.`);
        return;
    });
}

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {String} guildID guild ID
 * @param {import("discord.js").VoiceChannel} voiceChannel voice channel
 * @param {Document} effect sound effect to queue
*/
async function createQueue(client, guildID, voiceChannel, effect) {
    // Create queue struct
    const queueConstruct = {
        voiceChannel: voiceChannel,
        connection: null,
        effects: [],
        volume: 2,
        playing: true
    };
    // Add song to queue
    queueConstruct.effects.push(effect);

    // Add queue struct to list of server playing soundboard effects
    client.soundboardGuilds.set(guildID, queueConstruct);

    try {
        let connection = await queueConstruct.voiceChannel.join();
        connection.voice.setSelfDeaf(true);
        queueConstruct.connection = connection;
        playEffect(client, guildID);
    }
    catch (err) {
        console.error(`Failed to join channel (${voiceChannel.id}) and start playing soundboard effect (${effect.name}: ${effect.link}): `, err);
        client.soundboardGuilds.delete(guildID);
        return;
    }
}

/**
 * @param {import("discord.js").Client} client Discord Client instance
 * @param {String} guildID guild ID
*/
async function playEffect(client, guildID) {
    const serverQueue = client.soundboardGuilds.get(guildID);
    const effect = serverQueue.effects[0];

    // No more effects left in queue
    if (!effect) {
        serverQueue.voiceChannel.leave();
        client.soundboardGuilds.delete(guildID);
        return;
    }

    let dispatcher;
    // YouTube link
    if (ytdl.validateURL(effect.link)) {
        dispatcher = serverQueue.connection.play(ytdl(effect.link))
            .on("finish", () => {
                serverQueue.effects.shift();
                playEffect(client, guildID);
            })
            .on("error", (err) => {
                console.error("Error playing soundboard effect: ", err);
                serverQueue.effects.shift();
                playEffect(client, guildID);
            });
    } else {
        dispatcher = serverQueue.connection.play(effect.link)
            .on("finish", () => {
                serverQueue.effects.shift();
                playEffect(client, guildID);
            })
            .on("error", (err) => {
                console.error("Error playing soundboard effect: ", err);
                serverQueue.effects.shift();
                playEffect(client, guildID);
            });
    }
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 10);
}