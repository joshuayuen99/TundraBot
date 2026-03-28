import { pgTable, bigint } from "drizzle-orm/pg-core";
import { timestamps } from "../columnHelpers.ts";
import { DB } from "../db.ts";

export const usersTable = pgTable("users", {
    id: bigint({ mode: "bigint" }).primaryKey(),
    ...timestamps,
});

export type User = typeof usersTable.$inferInsert;

export async function insertUser(user: User) {
    return DB.insert(usersTable).values(user);
}
