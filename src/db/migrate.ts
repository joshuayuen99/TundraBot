import { migrate } from "drizzle-orm/node-postgres/migrator";

import { Logger } from "../utils/Logger.ts";
import { createDbPool, createDbConnection } from "./db.ts";

async function main() {
    Logger.info("Running migrations...");

    let pool;
    try {
        pool = createDbPool();
        const db = createDbConnection(pool);

        await migrate(db, { migrationsFolder: "./drizzle" });
        Logger.info("Migrations complete!");
    } catch (err) {
        Logger.error(err);
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

main();
