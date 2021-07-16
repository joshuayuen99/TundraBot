import { EventHandler } from "../base/EventHandler";
import { GuildMember, MessageEmbed, TextChannel } from "discord.js";
import { formatDateLong, sendMessage } from "../utils/functions";
import Deps from "../utils/deps";
import { TundraBot } from "../base/TundraBot";
import { DBGuild } from "../models/Guild";
import Logger from "../utils/logger";

export default class GuildMemberRemoveHandler extends EventHandler {
    protected DBGuildManager: DBGuild;
    constructor(client: TundraBot) {
        super(client);
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
    }

    async invoke(member: GuildMember): Promise<void> {
        try {
            if (!member.guild.available) return;

            const settings = await this.DBGuildManager.get(member.guild);

            // Leave messages are enabled
            if (settings.leaveMessages.enabled) {
                const guild = member.guild;
                const micon = member.user.displayAvatarURL();

                const embedMsg = new MessageEmbed()
                    .setDescription(
                        `${member.user} (${member.user.tag}) left the server`
                    )
                    .setColor("RED")
                    .setThumbnail(micon)
                    .addField(
                        `${member.user.username} joined`,
                        `${formatDateLong(member.joinedAt)} EST`
                    )
                    .addField("New total members", guild.memberCount)
                    .setTimestamp();

                const logChannel = guild.channels.cache.find(
                    (channel) => channel.id === settings.leaveMessages.channelID
                ) as TextChannel;

                if (logChannel) {
                    sendMessage(this.client, embedMsg, logChannel);
                }
            }
        } catch (err) {
            Logger.log("error", `guildMemberRemove event error:\n${err}`);
        }
    }
}
