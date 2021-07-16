/* eslint-disable no-case-declarations */
import { Command, CommandContext } from "../../base/Command";
import { MessageEmbed, PermissionString } from "discord.js";
import { getRole, getTextChannel, sendReply } from "../../utils/functions";
import { stripIndents } from "common-tags";
import Logger from "../../utils/logger";
import { DBGuild } from "../../models/Guild";
import Deps from "../../utils/deps";

export default class Config implements Command {
    name = "config";
    aliases = ["configs", "settings"];
    category = "moderation";
    description = stripIndents`Allows members with the \`Manage Server\` permission to edit the config for the bot.

    No arguments will display all the current settings.
    config <setting> will display the current value of that particular setting.
    config <setting> <new value> will change the value of that particular setting.`;
    usage = "config [setting] [new value]";
    examples = ["config", "config prefix", "config prefix !"];
    enabled = true;
    guildOnly = true;
    botPermissions = [];
    memberPermissions: PermissionString[] = ["MANAGE_GUILD"];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds

    DBGuildManager: DBGuild;
    constructor() {
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
    }

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        let setting;
        if (args[0]) setting = args[0].toLowerCase();
        else setting = args[0];

        const newSetting = args.slice(1).join(" ");

        switch (setting) {
            case "prefix": {
                if (!newSetting) {
                    sendReply(
                        ctx.client,
                        `Current prefix: \`${ctx.guildSettings.prefix}\``,
                        ctx.msg
                    );
                    return;
                } else {
                    // new setting
                    try {
                        const updatedSettings =
                            await this.DBGuildManager.update(ctx.guild, {
                                prefix: newSetting,
                            });

                        sendReply(
                            ctx.client,
                            `Prefix updated to: \`${updatedSettings.prefix}\``,
                            ctx.msg
                        );
                        return;
                    } catch (err) {
                        Logger.log(
                            "error",
                            `Error updating prefix in config:\n${err}`
                        );
                        sendReply(
                            ctx.client,
                            `An error occurred: **${err.message}**`,
                            ctx.msg
                        );
                    }
                }

                break;
            }
            case "logchannel": {
                const logChannel = ctx.guild.channels.cache.find(
                    (channel) =>
                        channel.id === ctx.guildSettings.logMessages.channelID
                );

                if (!newSetting) {
                    if (!ctx.guildSettings.logMessages.enabled || !logChannel) {
                        // disabled
                        sendReply(
                            ctx.client,
                            "Current channel for logging: `None`.",
                            ctx.msg
                        );
                        return;
                    } else {
                        sendReply(
                            ctx.client,
                            `Current channel for logging: ${logChannel}`,
                            ctx.msg
                        );
                        return;
                    }
                } else {
                    // new setting
                    const newLogChannel = await getTextChannel(
                        ctx.guild,
                        newSetting
                    );

                    if (!newLogChannel) {
                        sendReply(
                            ctx.client,
                            "Sorry, I couldn't find that channel. Please try again and make sure you entered it correctly.",
                            ctx.msg
                        );
                        return;
                    }

                    try {
                        const updatedSettings =
                            await this.DBGuildManager.update(ctx.guild, {
                                logMessages: {
                                    enabled: true,
                                    channelID: newLogChannel.id,
                                },
                            });

                        sendReply(
                            ctx.client,
                            `Log channel updated to: <#${updatedSettings.logMessages.channelID}>`,
                            ctx.msg
                        );

                        return;
                    } catch (err) {
                        Logger.log(
                            "error",
                            `Error updating logChannel in config:\n${err}`
                        );
                        sendReply(
                            ctx.client,
                            `An error occurred: **${err.message}**`,
                            ctx.msg
                        );
                    }
                }

                break;
            }
            case "soundboardrole": {
                if (!newSetting) {
                    sendReply(
                        ctx.client,
                        `Current role for using most soundboard commands: <@&${ctx.guildSettings.soundboardRoleID}>`,
                        ctx.msg
                    );
                    return;
                }

                const newRole = await getRole(ctx.guild, newSetting);

                if (!newRole) {
                    sendReply(
                        ctx.client,
                        "Sorry, I couldn't find that role. Please try again and make sure you entered it correctly.",
                        ctx.msg
                    );
                    return;
                }

                try {
                    const updatedSettings = await this.DBGuildManager.update(
                        ctx.guild,
                        { soundboardRoleID: newRole.id }
                    );

                    sendReply(
                        ctx.client,
                        `Soundboard role updated to: <@&${updatedSettings.soundboardRoleID}>`,
                        ctx.msg
                    );
                    return;
                } catch (err) {
                    Logger.log(
                        "error",
                        `Error updating soundboardRole in config:\n${err}`
                    );
                    sendReply(
                        ctx.client,
                        `An error occurred: **${err.message}**`,
                        ctx.msg
                    );
                }
                break;
            }
            default:
                try {
                    let settingsString = "";
                    // prefix
                    settingsString += `**prefix**: \`${ctx.guildSettings.prefix}\`\n`;

                    // logChannel
                    const logChannel = ctx.client.channels.cache.get(
                        ctx.guildSettings.logMessages.channelID
                    );
                    settingsString += `**logChannel**: ${
                        logChannel ? logChannel : "`None`"
                    }\n`;

                    // soundboardRole
                    const soundboardRole = ctx.guild.roles.cache.get(
                        ctx.guildSettings.soundboardRoleID
                    );

                    // @everyone role if none specified
                    settingsString += `**soundboardRole**: ${
                        soundboardRole ? soundboardRole : `<@&${ctx.guild.id}>`
                    }\n`;

                    settingsString += `\nFor additional configuration visit my [web dashboard](${process.env.DASHBOARD_URL}) and log in to see this server!`;

                    const embedMsg = new MessageEmbed()
                        .setColor("PURPLE")
                        .setTitle("Configuration Settings")
                        .setDescription(settingsString);

                    sendReply(ctx.client, embedMsg, ctx.msg);
                    return;
                } catch (err) {
                    Logger.log(
                        "error",
                        `Error displaying guild config (${ctx.guild.id}):\n${err}`
                    );
                    sendReply(
                        ctx.client,
                        `An error occurred: **${err.message}**`,
                        ctx.msg
                    );
                }

                break;
        }
    }
}
