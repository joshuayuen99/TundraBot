import { defineRelations } from "drizzle-orm";
import { usersTable } from "./schema/user.ts";
import { membersTable } from "./schema/member.ts";
import { emojisTable } from "./schema/emoji.ts";
import { guildsTable } from "./schema/guild.ts";
import { channelsTable } from "./schema/channel.ts";
import { messagesTable } from "./schema/message.ts";
import { emojiStealerMessagesTable } from "./schema/emojiStealerMessage.ts";

export const relations = defineRelations(
    {
        channelsTable,
        emojisTable,
        emojiStealerMessagesTable,
        guildsTable,
        membersTable,
        messagesTable,
        usersTable,
    },
    (r) => ({
        channelsTable: {
            guild: r.one.guildsTable({
                from: r.channelsTable.guildId,
                to: r.guildsTable.id,
                optional: true,
            }),
        },
        emojiStealerMessagesTable: {
            emoji: r.one.emojisTable({
                from: r.emojiStealerMessagesTable.emojiId,
                to: r.emojisTable.id,
                optional: false,
            }),
        },
        emojisTable: {
            emojiStealerMessage: r.many.messagesTable({
                from: r.emojisTable.id.through(
                    r.emojiStealerMessagesTable.emojiId
                ),
                to: r.messagesTable.id.through(
                    r.emojiStealerMessagesTable.messageId
                ),
            }),
        },
        membersTable: {
            user: r.one.usersTable({
                from: r.membersTable.userId,
                to: r.usersTable.id,
                optional: false,
            }),
            guild: r.one.guildsTable({
                from: r.membersTable.guildId,
                to: r.guildsTable.id,
                optional: false,
            }),
        },
        messagesTable: {
            author: r.one.usersTable({
                from: r.messagesTable.authorId,
                to: r.usersTable.id,
                optional: false,
            }),
            channel: r.one.channelsTable({
                from: r.messagesTable.channelId,
                to: r.channelsTable.id,
                optional: false,
            }),
            emojiStealerEmoji: r.one.emojisTable({
                from: r.messagesTable.id.through(
                    r.emojiStealerMessagesTable.messageId
                ),
                to: r.emojisTable.id.through(
                    r.emojiStealerMessagesTable.emojiId
                ),
                optional: true,
            }),
            emojiStealerInfo: r.one.emojiStealerMessagesTable({
                from: r.messagesTable.id,
                to: r.emojiStealerMessagesTable.messageId,
                optional: true,
            }),
        },
    })
);
