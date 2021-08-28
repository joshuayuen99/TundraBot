import { Client, Collection, Intents, Invite } from "discord.js";
import { DBGuild, guildInterface } from "../models/Guild";
import * as fs from "fs";
import { Command } from "./Command";
import { Player } from "discord-player";
import { Downloader as youtubeDownloader } from "@discord-player/downloader";
import { DBEvent, eventInterface } from "../models/Event";
import { DBRoleMenu, roleMenuInterface } from "../models/RoleMenu";
import { DBSoundEffect, soundEffectInterface } from "../models/SoundEffect";
import Deps from "../utils/deps";
import { DBMember } from "../models/Member";
import { DBMessage } from "../models/Message";
import { DBPoll } from "../models/Poll";
import { DBReminder } from "../models/Reminder";
import { DBUser } from "../models/User";
import { MemberSoundEffects } from "../helpers/loadMemberSoundEffects";
import { SoundboardQueue } from "../commands/music/soundboard";

import { DiscordTogether } from "discord-together";

export class TundraBot extends Client {
    /** <command name, command module> */
    commands: Collection<string, Command>;
    /** <command alias, command name> */
    aliases: Collection<string, string>;
    categories: string[];

    /** <command name, command module> */
    interactiveCommands: Collection<string, Command>;

    // TODO: add types
    player: Player;

    // Map with guilds playing soundboard effects
    /** <guildID, SoundboardQueue> */
    soundboardGuilds: Map<string, SoundboardQueue>;

    // Map with members playing games
    /** <`${message.guild.id}${message.member.id}`, TODO> */
    gameMembers: Map<string, any>;

    // Set of people currently stealing emojis in a server
    // <`${guildID}${userID}`>
    activeEmojiStealing: Set<string>;

    // Set of people we are currently waiting on a response from so that we can ignore any further commands until we get it
    /** <userID> */
    waitingResponse: Set<string>;

    // Map with invites for each guild
    /** <guildID, <invite code, invite>> */
    guildInvites: Map<string, Map<string, Invite>>;

    discordTogether: DiscordTogether<{ "TundraBot" }>;

    databaseCache: {
        /** <guildID, guildInterface> */
        settings: Collection<string, guildInterface>;
        /** <messageID, eventInterface> */
        events: Collection<string, eventInterface>;
        /** <messageID, roleMenuInterface> */
        roleMenus: Collection<string, roleMenuInterface>;
        /** <`${message.guild.id}${soundEffect.name}`, soundEffectInterface> */
        soundEffects: Collection<string, soundEffectInterface>;
        /** <`${message.member.guild.id}${message.author.id}`, MemberSoundEffects> */
        memberSoundEffects: Collection<string, MemberSoundEffects>;
    };

    constructor() {
        const intents = new Intents([
            Intents.FLAGS.DIRECT_MESSAGES,
            Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
            Intents.FLAGS.GUILD_INVITES,
            Intents.FLAGS.GUILD_MEMBERS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            Intents.FLAGS.GUILD_PRESENCES, // TODO: remove for production
            Intents.FLAGS.GUILD_VOICE_STATES,
        ]);
        super({ intents: intents, partials: ["CHANNEL"] });

        this.commands = new Collection();
        this.aliases = new Collection();
        this.categories = fs.readdirSync(__dirname + "/../commands");

        this.interactiveCommands = new Collection();

        Deps.buildDB(
            this,
            DBEvent,
            DBGuild,
            DBMember,
            DBMessage,
            DBPoll,
            DBReminder,
            DBRoleMenu,
            DBSoundEffect,
            DBUser
        );

        this.player = new Player(this, {
            ytdlOptions: {
                filter: "audioonly",
                highWaterMark: 1 << 25,
            },
        });
        // Doesn't work
        this.player.unuse("Attachment");
        this.player.unuse("Facebook");
        this.player.unuse("Reverbnation");
        this.player.unuse("Vimeo");

        this.player.use("YOUTUBE_DL", youtubeDownloader);

        // // Map with guilds' cached rulesets
        // client.rulesets = new Map();

        // // Map with guilds' cached rules
        // client.rules = new Map();

        // let triggers = [
        //     {
        //         type: "SlowmodeTrigger",
        //         settings: {
        //             threshold: 5,
        //             interval: 30000,
        //             userSpecific: true,
        //         },
        //     },
        // ];
        // let conditions = null;
        // let effects = [
        //     {
        //         type: "DELETE_MESSAGE",
        //         settings: null,
        //     },
        // ];

        // let spamRule = new Rule("spam", triggers, conditions, effects);
        // client.rules.set("770547365978701834", [spamRule]);

        this.soundboardGuilds = new Map();
        this.gameMembers = new Map();
        this.activeEmojiStealing = new Set();
        // TODO: use event emitting to properly set and remove users
        this.waitingResponse = new Set();
        this.guildInvites = new Map();

        this.discordTogether = new DiscordTogether(this);

        import("../utils/mongoose").then((module) => {
            module.init();
        });

        this.databaseCache = {
            settings: new Collection(),
            events: new Collection(),
            roleMenus: new Collection(),
            soundEffects: new Collection(),
            memberSoundEffects: new Collection(),
        };

        import("../handlers/commands").then(async (module) => {
            await module.default(this);
            import("../handlers/events").then(async (module) => {
                await module.default(this);
            });
        });
    }
}
