import { migrate } from "drizzle-orm/node-postgres/migrator";

import { Logger } from "../utils/Logger.ts";
import { pool, DB } from "./db.ts";

async function main() {
    Logger.info("Running migrations...");

    try {
        await migrate(DB, { migrationsFolder: "./drizzle" });
        Logger.info("Migrations complete!");
    } catch (err) {
        Logger.error(err);
    } finally {
        await pool.end();
    }
}

main();
