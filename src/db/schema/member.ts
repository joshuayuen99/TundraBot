import { pgTable, bigint, primaryKey } from "drizzle-orm/pg-core";
import { timestamps } from "../columnHelpers.ts";
import { DB } from "../db.ts";
import { usersTable } from "./user.ts";
import { guildsTable } from "./guild.ts";

export const membersTable = pgTable(
    "members",
    {
        userId: bigint({ mode: "bigint" }).references(() => usersTable.id),
        guildId: bigint({ mode: "bigint" }).references(() => guildsTable.id),
        ...timestamps,
    },
    (table) => [primaryKey({ columns: [table.userId, table.guildId] })]
);

export type Member = typeof membersTable.$inferInsert;

export async function insertMember(member: Member) {
    return DB.insert(membersTable).values(member);
}
