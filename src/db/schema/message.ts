import { pgTable, bigint } from "drizzle-orm/pg-core";

import { timestamps } from "../columnHelpers.ts";
import { channelsTable } from "./channel.ts";
import { usersTable } from "./user.ts";

export const messagesTable = pgTable("messages", {
    id: bigint({ mode: "bigint" }).primaryKey(),
    channelId: bigint({ mode: "bigint" })
        .references(() => channelsTable.id)
        .notNull(),
    authorId: bigint({ mode: "bigint" })
        .references(() => usersTable.id)
        .notNull(),
    ...timestamps,
});

export type Message = typeof messagesTable.$inferInsert;
