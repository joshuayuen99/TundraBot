import { Message, MessageEmbed, TextChannel } from "discord.js";
// import {
//     checkSlowmode,
//     SlowmodeTriggerData,
//     RuleMessageTrigger,
// } from "../automod/triggers";
// import * as effects from "../automod/effects";
import { TundraBot } from "../base/TundraBot";
import { DBGuild } from "../models/Guild";
import { EventHandler } from "../base/EventHandler";
import Deps from "../utils/deps";
import { DBMessage } from "../models/Message";
import { CommandContext } from "../base/Command";
import {
    validateBotPermissions,
    validateMemberPermissions,
} from "../utils/validators";
import Logger from "../utils/logger";
import { sendMessage, sendReply } from "../utils/functions";

export default class MessageHandler extends EventHandler {
    cmdCooldown: string[] = []; // user's command cooldowns with userIDs as keys

    protected DBGuildManager: DBGuild;
    protected DBMessageManager: DBMessage;
    constructor(client: TundraBot) {
        super(client);

        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
        this.DBMessageManager = Deps.get<DBMessage>(DBMessage);
    }

    async invoke(message: Message): Promise<void> {
        if (message.author.bot) return; // if a bot sent the message

        try {
            // Sent in a guild
            if (message.guild) {
                if (!message.guild.available) return;
                
                const settings = await this.DBGuildManager.get(message.guild);

                if (message.content || message.attachments) {
                    // Save to database
                    this.DBMessageManager.create(message).catch((err) => {
                        Logger.log(
                            "error",
                            `Error saving message to database:\n${err}`
                        );
                    });
                }

                // Did not contain the command prefix
                if (!message.content.trim().startsWith(settings.prefix)) return;

                // If we are waiting on a response from this member, skip the regular command handler
                if (this.client.waitingResponse.has(message.author.id)) return;

                const messageArray = message.content
                    .replace(/\s\s+/g, " ")
                    .split(" ");
                const cmd = messageArray[0]
                    .slice(settings.prefix.length)
                    .toLowerCase();
                const args = messageArray.slice(1);

                if (cmd.length === 0) return;

                let command = this.client.commands.get(cmd); // Set the command to call
                if (!command)
                    command = this.client.commands.get(
                        this.client.aliases.get(cmd)
                    ); // If the command was not found, check aliases

                // No command
                if (!command) return;

                // Command is disabled
                if (!command.enabled) return;

                // TODO: filter all rules by those that delete the message or something similar, then await only those before processing for commands then async call all others

                // Automod
                // const rules = client.rules.get(message.guild.id);

                // if (rules) {
                //     // TODO: not all triggers/effects will have the same types of parameters... think about how to fix
                //     for (const rule of rules) {
                //         for (const trigger of rule.triggers) {
                //             if (!(trigger instanceof RuleMessageTrigger)) continue;
                //             if (await trigger.checkTrigger(client, message)) {
                //                 for (const effect of rule.effects) {
                //                     // effect.execute(client, message).catch((err) => {
                //                     //     Logger.log("error", `Problem executing automod effect:\n${err}`);
                //                     // });
                //                 }
                //                 break;
                //             }
                //         }
                //     }

                //     // checkSlowmode(client, message, true, new SlowmodeTriggerData(5, 30000)).then((result) => {
                //     //     if (result) effects.DELETE_MESSAGE(client, message);
                //     // })
                // }

                // --------------------------------------------------

                // Sent in a blacklisted channel
                if (settings.blacklistedChannelIDs.includes(message.channel.id))
                    return;

                // @TundraBot
                if (
                    message.content.trim() === `<@${this.client.user.id}>` ||
                    message.content.trim() === `<@!${this.client.user.id}>`
                ) {
                    sendReply(this.client, `My prefix in this server is \`${settings.prefix}\``, message);
                    return;
                }

                const ctx = new CommandContext(
                    this.client,
                    command,
                    settings,
                    message
                );

                let userCooldown = this.cmdCooldown[message.author.id];
                if (!userCooldown) {
                    // user hasn't run a command yet
                    this.cmdCooldown[message.author.id] = {};
                    userCooldown = this.cmdCooldown[message.author.id];
                }

                const time = userCooldown[command.name] || 0;
                if (
                    time &&
                    time > Date.now() &&
                    message.author.id !== process.env.OWNERID
                ) {
                    const seconds = Math.ceil((time - Date.now()) / 1000);

                    const cooldownEmbed = new MessageEmbed()
                        .setColor("RED")
                        .setDescription(
                            `❌ You must wait \`${seconds} second${
                                seconds > 1 ? "s" : ""
                            }\` to use \`${cmd}\` again.`
                        );

                    sendMessage(
                        ctx.client,
                        cooldownEmbed,
                        message.channel as TextChannel
                    );
                    return;
                }
                this.cmdCooldown[message.author.id][command.name] =
                    Date.now() + command.cooldown;

                if (!validateBotPermissions(ctx)) return;
                if (!validateMemberPermissions(ctx)) return;

                // TODO: comment before pushing
                Logger.log("cmd", `${cmd} ${args.join(" ")}`);
                command.execute(ctx, args).catch((err) => {
                    Logger.log(
                        "error",
                        `Error running command <${cmd}>:\n${err}`
                    );
                });
            } else if (message.channel.type === "dm") {
                // Sent in a DM
                const messageArray = message.content
                    .replace(/\s\s+/g, " ")
                    .split(" ");
                let cmd: string;
                const args = messageArray.slice(1);
                // Starts with the default command prefix
                if (
                    message.content
                        .trim()
                        .startsWith(process.env.COMMAND_PREFIX)
                ) {
                    cmd = messageArray[0]
                        .slice(process.env.COMMAND_PREFIX.length)
                        .toLowerCase();
                } else {
                    // No command prefix
                    cmd = messageArray[0].toLowerCase();
                }

                // If we are waiting on a response from this member, skip the regular command handler
                if (this.client.waitingResponse.has(message.author.id)) return;

                if (cmd.length === 0) return;

                let command = this.client.commands.get(cmd); // Set the command to call
                if (!command)
                    command = this.client.commands.get(
                        this.client.aliases.get(cmd)
                    ); // If the command was not found, check aliases

                // No command
                if (!command) return;

                // Command is disabled
                if (!command.enabled) return;

                // If the command is guildOnly and was sent in a DM
                if (command.guildOnly) return;

                const ctx = new CommandContext(
                    this.client,
                    command,
                    { prefix: process.env.COMMAND_PREFIX },
                    message
                );

                Logger.log("cmd", `${cmd} ${args.join(" ")}`);
                command.execute(ctx, args).catch((err) => {
                    Logger.log(
                        "error",
                        `Error running command <${cmd}>:\n${err}`
                    );
                });
            }

            /*
            if (!message.guild) {
                const owner = await this.client.users.fetch(
                    process.env.OWNERID
                );
                const messageContent = message.content;
                const messageAttachments = message.attachments;

                const embedMsg = new MessageEmbed()
                    .setColor("#0d6adb")
                    .setTimestamp(message.createdAt)
                    .setFooter(
                        message.author.username,
                        message.author.displayAvatarURL()
                    )
                    .setDescription("Attempted DM")
                    .addField(
                        "User information",
                        stripIndents`**\\> ID:** ${message.author.id}
                    **\\> Username:** ${message.author.username}
                    **\\> Discord Tag:** ${message.author.tag}
                    **\\> Created account:** ${formatDate(
                        message.author.createdAt
                    )}`,
                        true
                    );

                if (messageContent) {
                    // If there is text in the DM
                    embedMsg.addField("Text:", messageContent);
                }
                if (messageAttachments.first()) {
                    // If there is an attachment in the DM
                    messageAttachments.forEach((attachment) => {
                        embedMsg.addField("Attachment:", attachment.url);
                    });
                    embedMsg.setImage(messageAttachments.first().url);

                    let attachments = messageAttachments.find(
                        (attachment) => attachment.id
                    ).url;

                    embedMsg.addField("Attachments:", attachments);
                    embedMsg.setImage(attachments);
                }

                owner.send(embedMsg);

                return;

                // return message.channel.send(`Message my master ${process.env.OWNERNAME}${process.env.OWNERTAG} instead!`);
            }
            */
        } catch (err) {
            Logger.log("error", `message event error:\n${err}`);
        }
    }
}
