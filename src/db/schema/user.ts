import { pgTable, bigint } from "drizzle-orm/pg-core";
import { timestamps } from "../columnHelpers.ts";
import { DB } from "../db.ts";

export const userTable = pgTable("users", {
    id: bigint({ mode: "bigint" }).primaryKey(),
    ...timestamps,
});

export type User = typeof userTable.$inferInsert;

export async function insertUser(user: User) {
    return DB.insert(userTable).values(user);
}
