import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { createDbConnection } from "../../src/db/db.ts";
import { createRepositories } from "../../src/db/utilities.ts";

export async function initCommon() {
    const container = await new PostgreSqlContainer("postgres:18").start();

    const pool = new Pool({
        connectionString: container.getConnectionUri(),
    });

    const db = createDbConnection(pool);
    await migrate(db, { migrationsFolder: "./drizzle" });

    const repos = createRepositories(db);

    return { container, pool, db, repos };
}
