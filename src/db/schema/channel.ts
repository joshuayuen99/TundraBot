import { pgTable, bigint } from "drizzle-orm/pg-core";

import { timestamps } from "../columnHelpers.ts";
import { guildsTable } from "./guild.ts";

export const channelsTable = pgTable("channels", {
    id: bigint({ mode: "bigint" }).primaryKey(),
    guildId: bigint({ mode: "bigint" }).references(() => guildsTable.id),
    ...timestamps,
});

export type Channel = typeof channelsTable.$inferInsert;
