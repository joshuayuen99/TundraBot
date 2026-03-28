import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
    createdAt: timestamp({ precision: 6, withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp({ precision: 6, withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => sql`(now() AT TIME ZONE 'utc'::text)`),
};
