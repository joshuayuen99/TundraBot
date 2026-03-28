import { pgTable, bigint, timestamp } from "drizzle-orm/pg-core";
import { timestamps } from "../columnHelpers.ts";
import { DB } from "../db.ts";

export const guildsTable = pgTable("guilds", {
    id: bigint({ mode: "bigint" }).primaryKey(),
    latestJoinedAt: timestamp({ precision: 6, withTimezone: true })
        .notNull()
        .defaultNow(),
    latestLeftAt: timestamp({ precision: 6, withTimezone: true }),
    ...timestamps,
});

export type Guild = typeof guildsTable.$inferInsert;

export async function insertGuild(guild: Guild) {
    return DB.insert(guildsTable).values(guild);
}
