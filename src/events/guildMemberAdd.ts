import { EventHandler } from "../base/EventHandler";
import { Guild, GuildMember, MessageEmbed, TextChannel } from "discord.js";
import { formatDateLong, sendMessage } from "../utils/functions";
import Deps from "../utils/deps";
import { TundraBot } from "../base/TundraBot";
import { DBGuild } from "../models/Guild";
import Logger from "../utils/logger";

export default class GuildMemberAddHandler extends EventHandler {
    protected DBGuildManager: DBGuild;
    constructor(client: TundraBot) {
        super(client);
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
    }

    async invoke(member: GuildMember): Promise<void> {
        try {
            if (!member.guild.available) return;

            const settings = await this.DBGuildManager.get(member.guild);

            // Join messages are enabled
            if (settings.joinMessages.enabled) {
                const guild = member.guild;
                const micon = member.user.displayAvatarURL();

                const embedMsg = new MessageEmbed()
                    .setDescription(
                        `${member.user} (${member.user.tag}) joined the server`
                    )
                    .setColor("GREEN")
                    .setThumbnail(micon)
                    .addField(
                        `${member.user.username} joined`,
                        `${formatDateLong(member.joinedAt)} EST`
                    )
                    .addField("New total members", guild.memberCount)
                    .setTimestamp();

                // Invite tracker enabled
                if (settings.joinMessages.trackInvites) {
                    await guild
                        .fetchInvites()
                        .then((invites) => {
                            const cachedInvites = this.client.guildInvites.get(
                                guild.id
                            );

                            let inviteUsed;
                            for (const invite of invites) {
                                if (!cachedInvites.get(invite[0])) continue;
                                if (
                                    cachedInvites.get(invite[0]).uses <
                                    invite[1].uses
                                ) {
                                    inviteUsed = invite[1];

                                    // Update cached invite uses
                                    cachedInvites.set(invite[0], invite[1]);
                                    break;
                                }
                            }

                            if (inviteUsed)
                                embedMsg.addField(
                                    "Invited by: ",
                                    `${
                                        inviteUsed.inviter
                                            ? `${inviteUsed.inviter} (${inviteUsed.inviter.tag})`
                                            : "Unknown"
                                    }\nCode: ${inviteUsed.code}\nUses: ${
                                        inviteUsed.uses
                                    }`
                                );
                        })
                        .catch((err) => {
                            Logger.log(
                                "error",
                                `Invite tracker fetchInvites error:\n${err}`
                            );
                        });
                }

                const logChannel = guild.channels.cache.find(
                    (channel) => channel.id === settings.joinMessages.channelID
                ) as TextChannel;

                if (logChannel) {
                    sendMessage(this.client, embedMsg, logChannel);
                }
            }

            // Welcome message is enabled
            if (settings.welcomeMessage.enabled) {
                const parsedWelcomeMessage = this.parseWelcomeMessage(
                    settings.welcomeMessage.welcomeMessage,
                    member,
                    member.guild
                );

                const welcomeChannel = member.guild.channels.cache.find(
                    (channel) =>
                        channel.id === settings.welcomeMessage.channelID
                ) as TextChannel;

                if (welcomeChannel) {
                    sendMessage(this.client, parsedWelcomeMessage, welcomeChannel);
                }
            }
        } catch (err) {
            Logger.log("error", `guildMemberAdd event error:\n${err}`);
        }
    }

    parseWelcomeMessage(message: string, member: GuildMember, guild: Guild): string {
        let parsedMessage = message.replace("{{member}}", member.user.username);
        parsedMessage = parsedMessage.replace("{{server}}", guild.name);
    
        return parsedMessage;
    }
}
