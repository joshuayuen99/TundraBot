import { Client } from "discord.js";
import { Collection } from "mongoose";
import * as fs from "fs";

export class TundraBot extends Client {
    config = {
        owner: process.env.OWNERID,
        prefix: process.env.COMMAND_PREFIX,
        defaultGuildSettings: {
            prefix: process.env.COMMAND_PREFIX,
            welcomeMessage: {
                enabled: false,
                welcomeMessage: "Welcome **{{member}}** to **{{server}}**!",
                channelID: null,
            },
            soundboardRole: "Soundboard DJ",
            modRole: "Moderator",
            adminRole: "Administrator",
            logChannel: "tundra-logs",
        },
    };

    mongoose: {
        init: () => void;
    };

    commands: Collection;
    aliases: Collection;
    categories: string[];

    // TODO: add types
    // Map with guilds playing music
    musicGuilds: Map<any, any>;

    // Map with guilds playing soundboard effects
    soundboardGuilds: Map<any, any>;

    // Map with members playing games
    gameMembers: Map<any, any>;

    // Set of people currently stealing emojis in a server
    // `${guildID}${userID}
    activeEmojiStealing: Set<any>;

    // Set of people we are currently waiting on a response from so that we can ignore any further commands until we get it
    waitingResponse: Set<any>;

    // Map with invites for each guild
    guildInvites: Map<any, any>;

    databaseCache = {
        settings: Collection,
        events: Collection,
        roleMenus: Collection,
        soundEffects: Collection,
        memberSoundEffects: Collection,
    };

    constructor() {
        super({});

        this.mongoose = require("./utils/mongoose");
        require("./utils/mongooseFunctions")(this);

        this.commands = new Collection("commands", null);
        this.aliases = new Collection("aliases", null);
        this.categories = fs.readdirSync("./commands/");

        ["commands", "events"].forEach((handler) => {
            require(`./handlers/${handler}`)(this);
        });

        this.musicGuilds = new Map();
        this.soundboardGuilds = new Map();
        this.gameMembers = new Map();
        this.activeEmojiStealing = new Set();
        this.waitingResponse = new Set();
        this.guildInvites = new Map();

        this.mongoose.init();

        this.databaseCache.settings = new Collection("settings", null);
        this.databaseCache.events = new Collection("events", null);
        this.databaseCache.roleMenus = new Collection("roleMenus", null);
        this.databaseCache.soundEffects = new Collection("soundEffects", null);
        this.databaseCache.memberSoundEffects = new Collection(
            "memberSoundEffects",
            null
        );
    }
}