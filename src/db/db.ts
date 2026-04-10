import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { Env, getEnv } from "../utils/loadEnvironmentVars.ts";
import { relations } from "./relations.ts";

export type DBType = ReturnType<typeof createDbConnection>;

export function createDbPool(): Pool {
    return new Pool({
        host: getEnv(Env.DATABASE_URL),
        port: parseInt(getEnv(Env.DATABASE_PORT)),
        database: getEnv(Env.DATABASE_DB),
        user: getEnv(Env.DATABASE_USER),
        password: getEnv(Env.DATABASE_PASSWORD),
    });
}

export function createDbConnection(pool: Pool) {
    return drizzle({
        client: pool,
        relations: relations,
        casing: "snake_case",
    });
}
