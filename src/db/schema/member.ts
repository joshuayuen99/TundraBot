import { pgTable, bigint, primaryKey } from "drizzle-orm/pg-core";
import { timestamps } from "../columnHelpers.ts";
import { guildsTable } from "./guild.ts";
import { usersTable } from "./user.ts";

export const membersTable = pgTable(
    "members",
    {
        userId: bigint({ mode: "bigint" })
            .references(() => usersTable.id)
            .notNull(),
        guildId: bigint({ mode: "bigint" })
            .references(() => guildsTable.id)
            .notNull(),
        ...timestamps,
    },
    (table) => [primaryKey({ columns: [table.userId, table.guildId] })]
);

export type Member = typeof membersTable.$inferInsert;
