import { pgTable, bigint, timestamp } from "drizzle-orm/pg-core";

import { timestamps } from "../columnHelpers.ts";

export const guildsTable = pgTable("guilds", {
    id: bigint({ mode: "bigint" }).primaryKey(),
    latestJoinedAt: timestamp({ precision: 6, withTimezone: true })
        .notNull()
        .defaultNow(),
    latestLeftAt: timestamp({ precision: 6, withTimezone: true }),
    ...timestamps,
});

export type Guild = typeof guildsTable.$inferInsert;
