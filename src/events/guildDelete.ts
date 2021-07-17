import { EventHandler } from "../base/EventHandler";
import { Guild, MessageEmbed } from "discord.js";
import { formatDateShort, formatDateLong } from "../utils/functions";
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
        await this.DBGuildManager.delete(guild).catch((err) => {
            Logger.log("error", `Error deleting guild from database:\n${err}`);
        });

        Logger.log("info", `Left guild: ${guild.name}`);

        this.notifyOwner(guild);
    }

    async notifyOwner(guild: Guild): Promise<void> {
        const owner = await this.client.users.fetch(process.env.OWNERID);

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
                **\\> Joined at:** ${formatDateLong(guild.me.joinedAt)}`
            );
        if (guild.owner) {
            embedMsg.addField(
                "Server owner information",
                stripIndents`**\\> ID:** ${guild.owner.user.id}
                **\\> Username:** ${guild.owner.user.username}
                **\\> Discord Tag:** ${guild.owner.user.tag}
                **\\> Created account:** ${formatDateShort(guild.owner.user.createdAt)}`,
                true
            );
        }

        owner.send(embedMsg);
    }
}
