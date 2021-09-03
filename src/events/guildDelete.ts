import { EventHandler } from "../base/EventHandler";
import { Guild, MessageEmbed, TextChannel } from "discord.js";
import {
    formatDateShort,
    formatDateLong,
    sendMessage,
} from "../utils/functions";
import Deps from "../utils/deps";
import { TundraBot } from "../base/TundraBot";
import { DBGuild } from "../models/Guild";
import Logger from "../utils/logger";
import { stripIndents } from "common-tags";

export default class GuildDeleteHandler extends EventHandler {
    protected DBGuildManager: DBGuild;
    constructor(client: TundraBot) {
        super(client);
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
    }

    async invoke(guild: Guild): Promise<void> {
        if (!this.client.readyAt || !guild || !guild.name) return;

        await this.DBGuildManager.delete(guild).catch((err) => {
            Logger.log("error", `Error deleting guild from database:\n${err}`);
        });

        Logger.log("info", `Left guild: ${guild.name}`);

        this.notifyOwner(guild);
    }

    async notifyOwner(guild: Guild): Promise<void> {
        const [bots, users] = guild.members.cache.partition(
            (member) => member.user.bot
        );

        const embedMsg = new MessageEmbed()
            .setColor("RED")
            .setTimestamp()
            .setFooter(guild.name, guild.iconURL())
            .setAuthor("Left server :(", guild.iconURL())
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
        const guildOwner = this.client.users.cache.get(guild.ownerId);
        if (guildOwner) {
            embedMsg.addField(
                "Server owner information",
                stripIndents`**\\> ID:** ${guildOwner.id}
                    **\\> Username:** ${guildOwner.username}
                    **\\> Discord Tag:** ${guildOwner.tag}
                    **\\> Created account:** ${formatDateShort(guildOwner.createdAt)}`,
                true
            );
        }

        const supportGuild = await this.client.guilds.fetch(
            process.env.SUPPORT_SERVER_ID
        );

        const leaveChannel = supportGuild.channels.cache.get(
            process.env.SUPPORT_SERVER_LEAVE_CHANNEL_ID
        ) as TextChannel;

        sendMessage(this.client, { embeds: [embedMsg] }, leaveChannel);
    }
}
