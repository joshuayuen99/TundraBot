import { Command, CommandContext } from "../../base/Command";
import { sendMessage, sendReply } from "../../utils/functions";

import Logger from "../../utils/logger";

import {
    CollectorFilter,
    GuildEmoji,
    MessageEmbed,
    MessageReaction,
    PermissionResolvable,
    Permissions,
} from "discord.js";

import axios from "axios";

export default class StealEmoji implements Command {
    name = "stealemoji";
    aliases = ["steal"];
    category = "utility";
    description = "Steal emojis for this server by reacting with them.";
    usage = "stealemoji [emoji name]";
    enabled = true;
    slashCommandEnabled = false;
    guildOnly = true;
    botPermissions: PermissionResolvable[] = [
        Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS,
    ];
    memberPermissions: PermissionResolvable[] = [
        Permissions.FLAGS.MANAGE_EMOJIS_AND_STICKERS,
        Permissions.FLAGS.ADD_REACTIONS,
    ];
    ownerOnly = false;
    premiumOnly = false;
    cooldown = 5000; // 5 seconds

    async execute(ctx: CommandContext, args: string[]): Promise<void> {
        const embedMsg = new MessageEmbed()
            .setTitle("Emoji Stealer")
            .setDescription(
                `To steal an emoji and upload it to this server${
                    args[0] ? ` with the name \`${args[0]}\`` : ""
                }, react to this message with it.`
            )
            .setColor("GREEN")
            .setFooter("This stealer becomes invalid after 60s");

        const embedMessage = await sendMessage(
            ctx.client,
            { embeds: [embedMsg] },
            ctx.channel
        );

        // we don't have permission to send in this channel
        if (!embedMessage) return;

        // add member to list of people currently stealing emojis
        ctx.client.activeEmojiStealing.add(`${ctx.guild.id}${ctx.author.id}`);

        const filter: CollectorFilter<[MessageReaction]> = (reaction) => {
            if (!reaction.emoji.url) return false; // Emoji won't be uploadable
            if (reaction.partial) {
                reaction.fetch().then((r) => {
                    const emoji = r.emoji as GuildEmoji;

                    if (emoji.guild.id === r.message.guild.id) return false; // Emoji is from this guild

                    return true;
                });
            } else {
                const emoji = reaction.emoji as GuildEmoji;
                if (!emoji.guild) return true; // reaction comes from a server we don't know about (MessageReaction)
                if (
                    emoji.guild.id &&
                    emoji.guild.id === reaction.message.guild.id
                )
                    return false; // Emoji is from this guild

                return true;
            }
        };

        embedMessage
            .awaitReactions({ filter, max: 1, time: 60 * 1000 })
            .then(async (collected) => {
                const reactions = collected.filter((emoji) =>
                    emoji.users.cache.has(ctx.author.id)
                );
                if (reactions.size < 1) {
                    sendReply(
                        ctx.client,
                        "You're supposed to add a custom emoji...",
                        ctx.msg
                    );

                    return;
                }

                for (const [, reaction] of reactions) {
                    ctx.guild.emojis
                        .create(
                            (
                                await axios.get(reaction.emoji.url, {
                                    responseType: "arraybuffer",
                                })
                            ).data,
                            args[0] || reaction.emoji.name,
                            { reason: `Stolen by: ${ctx.author.tag}` }
                        )
                        .then(() => {
                            sendReply(ctx.client, "done.", ctx.msg);
                        })
                        .catch((err) => {
                            sendMessage(
                                ctx.client,
                                `Could not upload emoji: \`${
                                    args[0] || reaction.emoji.name
                                }\``,
                                ctx.channel
                            );

                            Logger.log(
                                "error",
                                `Could not upload emoji to (guildID: ${ctx.guild.id}): ${
                                    args[0] || reaction.emoji.name
                                } (${reaction.emoji.id}): ${err}`
                            );
                        });
                }

                return;
            })
            .catch((err) => {
                sendReply(ctx.client, "Something went wrong.", ctx.msg);
                Logger.log("error", `Error stealing emoji:\n${err}`);
            })
            .finally(() => {
                // remove member from list of people currently stealing emojis
                ctx.client.activeEmojiStealing.delete(
                    `${ctx.guild.id}${ctx.author.id}`
                );
            });
    }
}
