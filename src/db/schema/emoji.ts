import { pgTable, varchar, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "../columnHelpers.ts";

export const emojisTable = pgTable("emojis", {
    id: uuid().primaryKey().defaultRandom(),
    url: varchar({ length: 256 }).unique().notNull(),
    ...timestamps,
});

export type Emoji = typeof emojisTable.$inferInsert;
