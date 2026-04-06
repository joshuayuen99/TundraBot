import {
    pgTable,
    bigint,
    primaryKey,
    varchar,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../columnHelpers.ts";
import { emojisTable } from "./emoji.ts";
import { messagesTable } from "./message.ts";

export const emojiStealerMessagesTable = pgTable(
    "emoji_stealer_messages",
    {
        emojiId: uuid()
            .references(() => emojisTable.id)
            .notNull(),
        messageId: bigint({ mode: "bigint" })
            .references(() => messagesTable.id)
            .notNull(),
        guildEmojiId: bigint({ mode: "bigint" }).notNull(),
        emojiName: varchar({ length: 256 }).notNull(),
        ...timestamps,
    },
    (table) => [primaryKey({ columns: [table.emojiId, table.messageId] })]
);

export type EmojiStealer = typeof emojiStealerMessagesTable.$inferInsert;
