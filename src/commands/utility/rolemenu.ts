import { Command, CommandContext } from "../../base/Command";
import {
    Message,
    MessageEmbed,
    MessageReaction,
    PermissionResolvable,
    Permissions,
    TextChannel,
    User,
} from "discord.js";
import {
    getRole,
    getTextChannel,
    promptMessage,
    sendMessage,
    sendReply,
    waitResponse,
} from "../../utils/functions";
import { stripIndents } from "common-tags";
import Logger from "../../utils/logger";
import { DBGuild } from "../../models/Guild";
import Deps from "../../utils/deps";
import {
    DBRoleMenu,
    roleMenuInterface,
    RoleOption,
} from "../../models/RoleMenu";
import { TundraBot } from "../../base/TundraBot";

// TODO: switch from emojis in edit subcommand to using buttons
// TODO: switch from using emojis in confirm delete subcommand to using buttons

export default class RoleMenu implements Command {
    name = "rolemenu";
    aliases = ["rm"];
    category = "utility";
    description = `Starts an interactive wizard to create a rolemenu. Using the update flag allows you to update a pre-existing role menu by providing the message ID. Delete or remove will delete a role menu. If you don't know how to get a message ID, feel free to join [my support server](${process.env.SUPPORT_SERVER_INVITE_LINK}) and ask for help!`;
    usage = "rolemenu [edit `messageID`] [delete `messageID`]";
    examples = [
        "rolemenu",
        "rolemenu edit 769504779809587230",
        "rolemenu delete 769504779809587230",
    ];
    enabled = true;
    slashCommandEnabled = false;
    guildOnly = true;
    botPermissions: PermissionResolvable[] = [
        Permissions.FLAGS.MANAGE_ROLES,
        Permissions.FLAGS.ADD_REACTIONS,
    ];
    memberPermissions: PermissionResolvable[] = [
        Permissions.FLAGS.MANAGE_ROLES,
    ];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 10000; // 10 seconds

    DBGuildManager: DBGuild;
    DBRolemenuManager: DBRoleMenu;
    constructor() {
        this.DBGuildManager = Deps.get<DBGuild>(DBGuild);
        this.DBRolemenuManager = Deps.get<DBRoleMenu>(DBRoleMenu);
    }

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        if (!args[0]) this.createRoleMenu(ctx, args);
        else if (args.includes("edit")) {
            this.updateRoleMenu(ctx, args);
        } else if (args.includes("delete")) {
            this.removeRoleMenu(ctx, args);
        } else {
            this.createRoleMenu(ctx, args);
        }
    }

    async createRoleMenu(ctx: CommandContext, args: string[]): Promise<void> {
        if (
            !(await sendMessage(
                ctx.client,
                "What channel should I put the rolemenu in? eg. #general (type `here` for the current one)",
                ctx.channel
            ))
        ) {
            return;
        }
        const postChannelMessage = await waitResponse(
            ctx.client,
            ctx.channel,
            ctx.author,
            120
        );
        if (!postChannelMessage) {
            sendReply(ctx.client, "Cancelling rolemenu.", ctx.msg);
            return;
        }

        let postChannel: TextChannel | void;
        if (postChannelMessage.content.toLowerCase() === "here") {
            postChannel = ctx.channel;
        } else {
            postChannel = await getTextChannel(
                ctx.guild,
                postChannelMessage.content
            );
        }

        // Channel doesn't exist
        if (!postChannel) {
            sendReply(
                ctx.client,
                "I couldn't find that channel! Cancelling rolemenu.",
                postChannelMessage
            );
            return;
        }

        // Check to make sure we have permission to post in the channel
        const botPermissionsIn = ctx.guild.me.permissionsIn(postChannel);
        if (!botPermissionsIn.has(Permissions.FLAGS.SEND_MESSAGES)) {
            sendReply(
                ctx.client,
                "I don't have permission to post in that channel. Contact your server admin to give me permission overrides.",
                postChannelMessage
            );
            return;
        }

        sendMessage(
            ctx.client,
            stripIndents`Using channel ${postChannel}
            What should I title the rolemenu?`,
            ctx.channel
        );

        const menuTitleMessage = await waitResponse(
            ctx.client,
            ctx.channel,
            ctx.author,
            120
        );
        if (!menuTitleMessage) {
            sendReply(ctx.client, "Cancelling rolemenu.", postChannelMessage);
            return;
        }

        const roleMenuEmbed = new MessageEmbed()
            .setColor("PURPLE")
            .setTitle(menuTitleMessage.content)
            .setFooter(
                "React with one of the above emojis to receive the specified role!"
            );

        const roleMenuMessage = (await sendMessage(
            ctx.client,
            { embeds: [roleMenuEmbed] },
            postChannel
        )) as Message;

        const roleMenuCreationMessage = (await sendMessage(
            ctx.client,
            "Rolemenu started! It will be updated as you go.",
            ctx.channel
        )) as Message;

        let roleMenuString = "";
        const roleOptions: RoleOption[] = [];

        let isDone = false;
        while (!isDone) {
            let retry = false;
            const emojiQueryEmbed = new MessageEmbed()
                .setTitle("Create Role Menu")
                .setDescription(
                    "What's the emoji to use? Type `done` to finish."
                )
                .setColor("YELLOW");

            let queryMessage = (await sendMessage(
                ctx.client,
                { embeds: [emojiQueryEmbed] },
                ctx.channel
            )) as Message;
            const responseEmojiMessage = await waitResponse(
                ctx.client,
                ctx.channel,
                ctx.author,
                5 * 60
            );
            if (!responseEmojiMessage) {
                if (queryMessage.deletable) queryMessage.delete();
                sendReply(
                    ctx.client,
                    "Cancelling rolemenu",
                    roleMenuCreationMessage
                );
                isDone = true;
                continue;
            } else if (responseEmojiMessage.content.toLowerCase() == "done") {
                if (queryMessage.deletable) queryMessage.delete();
                if (responseEmojiMessage.deletable) responseEmojiMessage.delete();
                roleMenuMessage.edit({
                    embeds: [
                        roleMenuEmbed
                            .setDescription(roleMenuString)
                            .setColor("BLUE"),
                    ],
                });

                const roleMenuObject = {
                    messageID: roleMenuMessage.id,
                    guildID: roleMenuMessage.guild.id,
                    channelID: roleMenuMessage.channel.id,
                    roleMenuTitle: menuTitleMessage.content,
                    roleOptions: roleOptions,
                } as roleMenuInterface;

                this.DBRolemenuManager.create(roleMenuObject)
                    .then(() => {
                        sendReply(
                            ctx.client,
                            `Rolemenu finished! Check ${postChannel} to see it.`,
                            ctx.msg
                        );
                    })
                    .catch((err) => {
                        Logger.log(
                            "error",
                            `Error creating rolemenu in database:\n${err}`
                        );
                    });

                isDone = true;
                continue;
            }

            for (const option of roleOptions) {
                if (option.emoji === responseEmojiMessage.content.trim()) {
                    sendReply(
                        ctx.client,
                        "That emoji is already being used!",
                        responseEmojiMessage
                    );
                    retry = true;
                    break;
                }
            }
            if (retry) continue;

            await roleMenuMessage
                .react(responseEmojiMessage.content.trim())
                .catch(() => {
                    sendReply(
                        ctx.client,
                        "I had trouble reacting with that emoji...",
                        responseEmojiMessage
                    );
                    retry = true;
                });
            if (retry) continue;

            roleMenuString += `${responseEmojiMessage.content.trim()}: \`none\``;
            roleMenuEmbed.setDescription(roleMenuString);
            roleMenuMessage.edit({ embeds: [roleMenuEmbed] });

            if (queryMessage.deletable) queryMessage.delete();
            const responseEmoji = responseEmojiMessage.content.trim();
            if (responseEmojiMessage.deletable) responseEmojiMessage.delete();

            let roleFound = false;
            while (!roleFound) {
                const roleQueryEmbed = new MessageEmbed()
                    .setTitle("Create Role Menu")
                    .setDescription(
                        `What role should ${responseEmoji} assign? eg. @everyone`
                    )
                    .setColor("YELLOW");

                queryMessage = (await sendMessage(
                    ctx.client,
                    { embeds: [roleQueryEmbed] },
                    ctx.channel
                )) as Message;
                const roleMessage = await waitResponse(
                    ctx.client,
                    ctx.channel,
                    ctx.author,
                    5 * 60
                );
                if (!roleMessage) {
                    if (queryMessage.deletable) queryMessage.delete();
                    sendReply(
                        ctx.client,
                        "Cancelling rolemenu",
                        roleMenuCreationMessage
                    );
                    isDone = true;
                    continue;
                }

                const role = await getRole(ctx.guild, roleMessage.content);
                if (!role) {
                    sendReply(
                        ctx.client,
                        "I couldn't find that role.",
                        roleMessage
                    );
                    continue;
                }
                roleFound = true;

                // Check that we have permission to assign that role
                const botHighestRole = ctx.guild.me.roles.highest;
                if (botHighestRole.comparePositionTo(role) < 0) {
                    sendReply(
                        ctx.client,
                        "I can't assign that role to people! My role in the server's role list must be above any roles that you want me to assign.",
                        roleMenuMessage
                    );
                    roleFound = false;
                    continue;
                }

                // Add to roleOptions
                roleOptions.push({
                    emoji: responseEmoji,
                    roleID: role.id,
                });

                // Edit rolemenu text
                roleMenuString = roleMenuString.slice(
                    0,
                    roleMenuString.length - 6
                );
                roleMenuString += `${role}\n`;
                roleMenuEmbed.setDescription(roleMenuString);
                roleMenuMessage.edit({ embeds: [roleMenuEmbed] });

                if (queryMessage.deletable) queryMessage.delete();
                if (roleMessage.deletable) roleMessage.delete();

                sendMessage(
                    ctx.client,
                    `${responseEmoji} added to role menu!`,
                    ctx.channel
                );
            }
        }
    }

    async updateRoleMenu(ctx: CommandContext, args: string[]): Promise<void> {
        try {
            const roleMenuMessageID = args[args.indexOf("edit") + 1];

            // no argument after "edit"
            if (!roleMenuMessageID) {
                sendReply(
                    ctx.client,
                    "Please specifiy a message ID after `edit`.",
                    ctx.msg
                );
                return;
            }

            const cachedRoleMenu =
                ctx.client.databaseCache.roleMenus.get(roleMenuMessageID);

            // message ID isn't a role menu
            if (!cachedRoleMenu) {
                sendReply(
                    ctx.client,
                    "I couldn't find a role menu with that message ID.",
                    ctx.msg
                );
                return;
            }

            const roleMenuMessage = await (<TextChannel>(
                await ctx.client.channels.fetch(cachedRoleMenu.channelID)
            )).messages.fetch(cachedRoleMenu.messageID);

            let roleMenuString = "";
            for (const option of cachedRoleMenu.roleOptions) {
                roleMenuString += `${option.emoji}: <@&${option.roleID}>\n`;
            }

            const roleMenuEmbed = new MessageEmbed()
                .setTitle(cachedRoleMenu.roleMenuTitle)
                .setDescription(roleMenuString)
                .setColor("YELLOW")
                .setFooter(
                    "React with one of the above emojis to receive the specified role!"
                );

            await roleMenuMessage.edit({ embeds: [roleMenuEmbed] });

            const updateEmbed = new MessageEmbed()
                .setTitle("Update Role Menu")
                .setDescription(
                    stripIndents`Please select an option from below:
                    1) \`Update title\`
                    2) \`Add role option\`
                    3) \`Remove role option\``
                )
                .setColor("PURPLE");

            const updateEmbedMessage = await sendReply(
                ctx.client,
                { embeds: [updateEmbed] },
                ctx.msg
            );
            if (!updateEmbedMessage) return;

            const ONE_EMOJI = "1️⃣";
            const TWO_EMOJI = "2️⃣";
            const THREE_EMOJI = "3️⃣";

            const emoji = await promptMessage(
                ctx.client,
                updateEmbedMessage,
                ctx.author,
                30,
                [ONE_EMOJI, TWO_EMOJI, THREE_EMOJI]
            );

            if (updateEmbedMessage.deletable) updateEmbedMessage.delete();

            switch (emoji) {
                case ONE_EMOJI: {
                    updateEmbed.setDescription("Please enter the new title.");
                    const updateEmbedMessage = (await sendMessage(
                        ctx.client,
                        { embeds: [updateEmbed] },
                        ctx.channel
                    )) as Message;
                    const newTitleMessage = (await waitResponse(
                        ctx.client,
                        ctx.channel,
                        ctx.author,
                        5 * 60
                    )) as Message;

                    roleMenuEmbed
                        .setTitle(newTitleMessage.content)
                        .setColor("BLUE");

                    roleMenuMessage.edit({ embeds: [roleMenuEmbed] });
                    if (updateEmbedMessage.deletable) updateEmbedMessage.delete();
                    if (newTitleMessage.deletable) newTitleMessage.delete();

                    cachedRoleMenu.roleMenuTitle = newTitleMessage.content;

                    // Update cache and database
                    this.DBRolemenuManager.update(
                        cachedRoleMenu.messageID,
                        cachedRoleMenu
                    ).catch((err) => {
                        Logger.log(
                            "error",
                            `Error updating role menu (${cachedRoleMenu.messageID}):\n${err}`
                        );
                    });

                    sendReply(ctx.client, "Rolemenu updated!", ctx.msg);

                    break;
                }
                case TWO_EMOJI: {
                    let isDone = false;
                    while (!isDone) {
                        let retry = false;
                        const emojiQueryEmbed = new MessageEmbed()
                            .setTitle("Update Role Menu")
                            .setDescription(
                                "What's the emoji to use? Type `done` to finish."
                            )
                            .setColor("YELLOW");

                        let queryMessage = (await sendMessage(
                            ctx.client,
                            { embeds: [emojiQueryEmbed] },
                            ctx.channel
                        )) as Message;
                        const responseEmojiMessage = await waitResponse(
                            ctx.client,
                            ctx.channel,
                            ctx.author,
                            5 * 60
                        );
                        if (!responseEmojiMessage) {
                            if (queryMessage.deletable) queryMessage.delete();
                            sendReply(
                                ctx.client,
                                "Cancelling rolemenu",
                                ctx.msg
                            );
                            roleMenuMessage.edit({
                                embeds: [roleMenuEmbed.setColor("BLUE")],
                            });
                            isDone = true;
                            continue;
                        } else if (
                            responseEmojiMessage.content.toLowerCase() == "done"
                        ) {
                            if (queryMessage.deletable) queryMessage.delete();
                            if (responseEmojiMessage.deletable) responseEmojiMessage.delete();
                            roleMenuMessage.edit({
                                embeds: [
                                    roleMenuEmbed
                                        .setDescription(roleMenuString)
                                        .setColor("BLUE"),
                                ],
                            });
                            sendReply(ctx.client, "Rolemenu updated!", ctx.msg);

                            isDone = true;
                            continue;
                        }

                        for (const option of cachedRoleMenu.roleOptions) {
                            if (option.emoji === responseEmojiMessage.content) {
                                sendReply(
                                    ctx.client,
                                    "That emoji is already being used!",
                                    responseEmojiMessage
                                );
                                retry = true;
                                break;
                            }
                        }
                        if (retry) continue;

                        await roleMenuMessage
                            .react(responseEmojiMessage.content)
                            .catch(() => {
                                sendReply(
                                    ctx.client,
                                    "I had trouble reacting with that emoji...",
                                    responseEmojiMessage
                                );
                                retry = true;
                            });
                        if (retry) continue;

                        roleMenuString += `${responseEmojiMessage.content}: \`none\``;
                        roleMenuEmbed.setDescription(roleMenuString);
                        roleMenuMessage.edit({ embeds: [roleMenuEmbed] });

                        if (queryMessage.deletable) queryMessage.delete();
                        const responseEmoji = responseEmojiMessage.content;
                        if (responseEmojiMessage.deletable) responseEmojiMessage.delete();

                        let roleFound = false;
                        while (!roleFound) {
                            const roleQueryEmbed = new MessageEmbed()
                                .setTitle("Update Role Menu")
                                .setDescription(
                                    `What role should ${responseEmoji} assign? eg. @everyone`
                                )
                                .setColor("YELLOW");

                            queryMessage = (await sendMessage(
                                ctx.client,
                                { embeds: [roleQueryEmbed] },
                                ctx.channel
                            )) as Message;
                            const roleMessage = await waitResponse(
                                ctx.client,
                                ctx.channel,
                                ctx.author,
                                5 * 60
                            );
                            if (!roleMessage) {
                                if (queryMessage.deletable) queryMessage.delete();
                                sendReply(
                                    ctx.client,
                                    "Cancelling rolemenu",
                                    ctx.msg
                                );
                                roleMenuMessage.edit({
                                    embeds: [roleMenuEmbed.setColor("BLUE")],
                                });
                                isDone = true;
                                continue;
                            }

                            const role = await getRole(
                                ctx.guild,
                                roleMessage.content
                            );
                            if (!role) {
                                sendReply(
                                    ctx.client,
                                    "I couldn't find that role.",
                                    roleMessage
                                );
                                continue;
                            }
                            roleFound = true;

                            // Check that we have permission to assign that role
                            const botHighestRole = ctx.guild.me.roles.highest;
                            if (botHighestRole.comparePositionTo(role) < 0) {
                                sendReply(
                                    ctx.client,
                                    "I can't assign that role to people! My role in the server's role list must be above any roles that you want me to assign.",
                                    roleMenuMessage
                                );
                                roleFound = false;
                                continue;
                            }

                            // Add to roleOptions
                            cachedRoleMenu.roleOptions.push({
                                emoji: responseEmoji,
                                roleID: role.id,
                            });

                            // Update cache and database
                            this.DBRolemenuManager.update(
                                cachedRoleMenu.messageID,
                                cachedRoleMenu
                            ).catch((err) => {
                                Logger.log(
                                    "error",
                                    `Error updating role menu (${cachedRoleMenu.messageID}):\n${err}`
                                );
                            });

                            // Edit rolemenu text
                            roleMenuString = roleMenuString.slice(
                                0,
                                roleMenuString.length - 6
                            );
                            roleMenuString += `${role}\n`;
                            roleMenuEmbed.setDescription(roleMenuString);
                            roleMenuMessage.edit({ embeds: [roleMenuEmbed] });

                            if (queryMessage.deletable) queryMessage.delete();
                            if (roleMessage.deletable) roleMessage.delete();

                            sendMessage(
                                ctx.client,
                                `${responseEmoji} added to role menu!`,
                                ctx.channel
                            );
                        }
                    }

                    roleMenuMessage.edit({
                        embeds: [roleMenuEmbed.setColor("BLUE")],
                    });
                    break;
                }
                case THREE_EMOJI: {
                    let isDone = false;
                    while (!isDone) {
                        const emojiQueryEmbed = new MessageEmbed()
                            .setTitle("Update Role Menu")
                            .setDescription(
                                "What's the emoji to remove? Type `done` to finish."
                            )
                            .setColor("YELLOW");

                        const queryMessage = (await sendMessage(
                            ctx.client,
                            { embeds: [emojiQueryEmbed] },
                            ctx.channel
                        )) as Message;
                        const responseEmojiMessage = await waitResponse(
                            ctx.client,
                            ctx.channel,
                            ctx.author,
                            5 * 60
                        );
                        if (!responseEmojiMessage) {
                            if (queryMessage.deletable) queryMessage.delete();
                            sendReply(
                                ctx.client,
                                "Cancelling rolemenu",
                                ctx.msg
                            );
                            roleMenuMessage.edit({
                                embeds: [roleMenuEmbed.setColor("BLUE")],
                            });
                            isDone = true;
                            continue;
                        } else if (
                            responseEmojiMessage.content.toLowerCase() == "done"
                        ) {
                            if (queryMessage.deletable) queryMessage.delete();
                            if (responseEmojiMessage.deletable) responseEmojiMessage.delete();
                            roleMenuMessage.edit({
                                embeds: [
                                    roleMenuEmbed
                                        .setDescription(roleMenuString)
                                        .setColor("BLUE"),
                                ],
                            });

                            sendReply(ctx.client, "Rolemenu updated!", ctx.msg);

                            isDone = true;
                            continue;
                        }

                        let removedEmoji = false;
                        for (const option of cachedRoleMenu.roleOptions) {
                            if (option.emoji === responseEmojiMessage.content) {
                                removedEmoji = true;
                                break;
                            }
                        }
                        if (!removedEmoji) {
                            sendReply(
                                ctx.client,
                                "That emoji isn't an option to choose from!",
                                responseEmojiMessage
                            );
                            continue;
                        }

                        // remove emoji from message
                        const messageReaction =
                            roleMenuMessage.reactions.cache.get(
                                responseEmojiMessage.content
                            );
                        if (messageReaction) {
                            messageReaction.remove().catch(() => undefined);
                        }

                        cachedRoleMenu.roleOptions =
                            cachedRoleMenu.roleOptions.filter(
                                (option) =>
                                    option.emoji !==
                                    responseEmojiMessage.content
                            );

                        // Update cache and database
                        this.DBRolemenuManager.update(
                            cachedRoleMenu.messageID,
                            cachedRoleMenu
                        ).catch((err) => {
                            Logger.log(
                                "error",
                                `Error updating role menu (${cachedRoleMenu.messageID}):\n${err}`
                            );
                        });

                        roleMenuString = "";
                        for (const option of cachedRoleMenu.roleOptions) {
                            roleMenuString += `${option.emoji}: <@&${option.roleID}>\n`;
                        }
                        roleMenuEmbed.setDescription(roleMenuString);
                        roleMenuMessage.edit({ embeds: [roleMenuEmbed] });

                        if (queryMessage.deletable) queryMessage.delete();
                        const responseEmoji = responseEmojiMessage.content;
                        if (responseEmojiMessage.deletable) responseEmojiMessage.delete();

                        sendMessage(
                            ctx.client,
                            `${responseEmoji} removed from role menu!`,
                            ctx.channel
                        );
                    }

                    roleMenuMessage.edit({
                        embeds: [roleMenuEmbed.setColor("BLUE")],
                    });
                    break;
                }
                default: {
                    // user didn't react in time
                    sendReply(
                        ctx.client,
                        "Cancelling role menu update.",
                        ctx.msg
                    );
                }
            }
        } catch (err) {
            Logger.log("error", `Error updating role menu:\n${err}`);
            sendReply(
                ctx.client,
                "I encountered an error trying to update the role menu.",
                ctx.msg
            );
        }
    }

    async removeRoleMenu(ctx: CommandContext, args: string[]): Promise<void> {
        const CONFIRM = "💯";
        const CANCEL = "\u274c"; // red "X" emoji

        try {
            const roleMenuMessageID = args[args.indexOf("delete") + 1];

            // no argument after "delete"
            if (!roleMenuMessageID) {
                sendReply(
                    ctx.client,
                    "Please specifiy a message ID after `delete`.",
                    ctx.msg
                );
                return;
            }

            const cachedRoleMenu =
                ctx.client.databaseCache.roleMenus.get(roleMenuMessageID);

            // message ID isn't a role menu
            if (!cachedRoleMenu) {
                sendReply(
                    ctx.client,
                    "I couldn't find a role menu with that message ID.",
                    ctx.msg
                );
                return;
            }

            const roleMenuMessage = await (<TextChannel>(
                await ctx.client.channels.fetch(cachedRoleMenu.channelID)
            )).messages.fetch(cachedRoleMenu.messageID);

            const confirmDeleteEmbed = new MessageEmbed()
                .setColor("RED")
                .setDescription("Confirm role menu deletion?")
                .setAuthor("This verification becomes invalid after 30s");

            const confirmDeleteMessage = await sendReply(
                ctx.client,
                { embeds: [confirmDeleteEmbed] },
                ctx.msg
            );
            if (!confirmDeleteMessage) return;

            const emoji = await promptMessage(
                ctx.client,
                confirmDeleteMessage,
                ctx.author,
                30,
                [CONFIRM, CANCEL]
            );

            if (confirmDeleteMessage.deletable) confirmDeleteMessage.delete();
            switch (emoji) {
                case CONFIRM:
                    {
                        if (roleMenuMessage.deletable) roleMenuMessage.delete();

                        // remove role menu from database and cache
                        this.DBRolemenuManager.delete(cachedRoleMenu.messageID);

                        sendReply(
                            ctx.client,
                            "Successfully deleted role menu.",
                            ctx.msg
                        );

                        // Logs enabled
                        if (ctx.guildSettings.logMessages.enabled) {
                            const logChannel = ctx.guild.channels.cache.find(
                                (channel) =>
                                    channel.id ===
                                    ctx.guildSettings.logMessages.channelID
                            ) as TextChannel;
                            if (!logChannel) {
                                // channel was removed, disable logging in settings
                                this.DBGuildManager.update(ctx.guild, {
                                    logMessages: {
                                        enabled: false,
                                        channelID: null,
                                    },
                                });
                            }

                            const logEmbed = new MessageEmbed()
                                .setColor("RED")
                                .setFooter(
                                    ctx.member.displayName,
                                    ctx.author.displayAvatarURL()
                                )
                                .setTimestamp()
                                .setTitle("Removed Role Menu")
                                .setDescription(
                                    stripIndents`**\\> Removed by: ${ctx.member}**`
                                );

                            if (logChannel)
                                sendMessage(
                                    ctx.client,
                                    { embeds: [logEmbed] },
                                    logChannel
                                );
                        }
                    }
                    break;
                case CANCEL: {
                    sendReply(
                        ctx.client,
                        "Rolemenu deletion cancelled.",
                        ctx.msg
                    );
                    break;
                }
            }
        } catch (err) {
            Logger.log("error", `Error deleting role menu:\n${err}`);
            sendReply(
                ctx.client,
                "I encountered an error trying to delete the role menu.",
                ctx.msg
            );
        }
    }

    static async roleMenuHandleMessageReactionAdd(
        client: TundraBot,
        reaction: MessageReaction,
        user: User
    ): Promise<void> {
        // it was our own reaction
        if (user.id == client.user.id) return;
        // not a role menu
        if (!client.databaseCache.roleMenus.has(reaction.message.id)) return;

        const cachedRoleMenu = client.databaseCache.roleMenus.get(
            reaction.message.id
        );
        for (const option of cachedRoleMenu.roleOptions) {
            if (option.emoji == reaction.emoji.toString()) {
                const member = await reaction.message.guild.members.fetch(
                    user.id
                );
                if (!member.roles.cache.has(option.roleID)) {
                    // give member the role
                    member.roles.add(option.roleID).catch(() => undefined);
                }

                break;
            }
        }
    }

    static async roleMenuHandleMessageReactionRemove(
        client: TundraBot,
        reaction: MessageReaction,
        user: User
    ): Promise<void> {
        // it was our own reaction
        if (user.id == client.user.id) return;
        // not a role menu
        if (!client.databaseCache.roleMenus.has(reaction.message.id)) return;

        const cachedRoleMenu = client.databaseCache.roleMenus.get(
            reaction.message.id
        );
        for (const option of cachedRoleMenu.roleOptions) {
            if (option.emoji == reaction.emoji.toString()) {
                const member = await reaction.message.guild.members.fetch(
                    user.id
                );
                if (!member) {
                    // member left the server and reactions were automatically removed
                    break;
                }

                if (member.roles.cache.has(option.roleID)) {
                    // remove the role
                    member.roles.remove(option.roleID).catch(() => undefined);
                }

                break;
            }
        }
    }
}
