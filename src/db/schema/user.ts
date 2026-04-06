import { pgTable, bigint } from "drizzle-orm/pg-core";

import { timestamps } from "../columnHelpers.ts";

export const usersTable = pgTable("users", {
    id: bigint({ mode: "bigint" }).primaryKey(),
    ...timestamps,
});

export type User = typeof usersTable.$inferInsert;
