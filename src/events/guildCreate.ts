import { EventHandler } from "../base/EventHandler";
import { Guild, MessageEmbed, TextChannel } from "discord.js";
import {
    createChannel,
    createRole,
    formatDateShort,
    formatDateLong,
    sendMessage,
} from "../utils/functions";
import Deps from "../utils/deps";
import { TundraBot } from "../base/TundraBot";
import { DBGuild } from "../models/Guild";
import Logger from "../utils/logger";
import { stripIndents } from "common-tags";
import defaults from "../config";

export default class GuildCreateHandler extends EventHandler {
    protected DBGuildManager: DBGuild;
    constructor(client: TundraBot) {
        super(client);
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
    }

    async invoke(guild: Guild): Promise<void> {
        try {
            await this.DBGuildManager.create(guild);

            Logger.log("info", `Joined new guild: ${guild.name}`);

            this.notifyOwner(guild);

            if (!guild.available) return;

            this.createChannels(guild);
            this.createRoles(guild);
        } catch (err) {
            Logger.log("error", `Join server error:\n${err}`);
        }
    }

    async notifyOwner(guild: Guild): Promise<void> {
        const [bots, users] = guild.members.cache.partition(
            (member) => member.user.bot
        );

        const embedMsg = new MessageEmbed()
            .setColor("GREEN")
            .setTimestamp()
            .setFooter(guild.name, guild.iconURL())
            .setAuthor("Joined server :)", guild.iconURL())
            .addField(
                "Guild information",
                stripIndents`**\\> ID:** ${guild.id}
                **\\> Name:** ${guild.name}
                **\\> Member count:** ${guild.memberCount}
                **\\> User count:** ${users.size}
                **\\> Bot count:** ${bots.size}
                **\\> Created at:** ${formatDateLong(guild.createdAt)}
                **\\> Joined at:** ${formatDateLong(guild.joinedAt)}`
            );
        if (!guild.owner) {
            await guild.members.fetch(guild.ownerID);
        }
        embedMsg.addField(
            "Server owner information",
            stripIndents`**\\> ID:** ${guild.owner.user.id}
            **\\> Username:** ${guild.owner.user.username}
            **\\> Discord Tag:** ${guild.owner.user.tag}
            **\\> Created account:** ${formatDateShort(guild.owner.user.createdAt)}`,
            true
        );

        const supportGuild = await this.client.guilds.fetch(process.env.SUPPORT_SERVER_ID);
        
        const joinChannel = supportGuild.channels.cache.get(process.env.SUPPORT_SERVER_JOIN_CHANNEL_ID) as TextChannel;

        sendMessage(this.client, embedMsg, joinChannel);
    }

    async createChannels(guild: Guild): Promise<void> {
        // Create log channel
        const logChannel = await createChannel(
            guild,
            defaults.defaultGuildSettings.logChannel,
            null
        );

        // We didn't have permissions to make one
        if (!logChannel) {
            this.DBGuildManager.update(guild, {
                logMessages: {
                    enabled: false,
                    channelID: null,
                },
            }).catch((err) => {
                Logger.log(
                    "error",
                    `Database error when updating logChannel:\n${err}`
                );
            });
            return;
        }

        this.DBGuildManager.update(guild, {
            logMessages: {
                enabled: true,
                channelID: logChannel.id,
            },
        }).catch((err) => {
            Logger.log(
                "error",
                `Database error when adding logChannel:\n${err}`
            );
        });

        const embedGreeting = new MessageEmbed()
            .setTitle("TundraBot Info")
            .setDescription(
                stripIndents`**Thanks for adding me to your server!**

                I offer lots of configuration via my [web dashboard](${process.env.DASHBOARD_URL}), but the basics can also be changed with commands as described below! If you run into any problems or you have any questions, please join my [Discord server](${process.env.SUPPORT_SERVER_INVITE_LINK}).

                My default prefix is \`${process.env.COMMAND_PREFIX}\` (not \`-\`)! This is the top-left key on most keyboards. To change this you may run \`${process.env.COMMAND_PREFIX}config prefix <new prefix>\` (without the <>s).

                This channel will serve as the default channel I will use to log whenever moderation commands are used and by who. You may also change this with \`${process.env.COMMAND_PREFIX}config logChannel <new channel>\`.

                Type \`${process.env.COMMAND_PREFIX}help\` to get started with a list of all commands! \`${process.env.COMMAND_PREFIX}help <command>\` will display more info on a specific command.`
            )
            .addField(
                "Useful links",
                `[Website/Dashboard](${process.env.DASHBOARD_URL}), [Invite Me](${process.env.BOT_INVITE_LINK}), [Support Server](${process.env.SUPPORT_SERVER_INVITE_LINK})`
            )
            .setColor("BLUE")
            .setThumbnail(this.client.user.displayAvatarURL());
        sendMessage(this.client, embedGreeting, logChannel);
    }

    async createRoles(guild: Guild): Promise<void> {
        // Create necessary roles for soundboard commands
        const soundboardRole = await createRole(
            guild,
            defaults.defaultGuildSettings.soundboardRole,
            null
        );

        if (!soundboardRole) {
            this.DBGuildManager.update(guild, {
                soundboardRoleID: guild.roles.cache.find(
                    (role) => role.name === "@everyone"
                ).id,
            }).catch((err) => {
                Logger.log(
                    "error",
                    `Database error when updating soundboardRoleID to @everyone:\n${err}`
                );
            });
            return;
        }

        this.DBGuildManager.update(guild, {
            soundboardRoleID: soundboardRole.id,
        }).catch((err) => {
            Logger.log(
                "error",
                `Database error when adding soundboardRole:\n${err}`
            );
        });
    }
}