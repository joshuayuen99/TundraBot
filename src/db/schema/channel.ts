import { pgTable, bigint } from "drizzle-orm/pg-core";
import { timestamps } from "../columnHelpers.ts";

export const channelsTable = pgTable("channels", {
    id: bigint({ mode: "bigint" }).primaryKey(),
    guildId: bigint({ mode: "bigint" }),
    ...timestamps,
});

export type Channel = typeof channelsTable.$inferInsert;
